import { describe, expect, it } from 'vitest'
import type { ProjectTreeItem } from '../src/data/dashboard'
import {
  addProjectToFolder,
  addProjectToRoot,
  findFolderById,
  findParentFolderId,
  findProjectById,
  formNodeId,
  getDefaultOpenFolderIds,
  getFolderPath,
  getSelectedProjectId,
  isIdWithinItem,
  isNameTaken,
  removeFolderPromotingChildren,
  removeProjectById,
  renameProjectById,
  uniqueName,
} from '../src/utils/projectTree'

function tree(): ProjectTreeItem[] {
  return [
    {
      id: 'folder-1',
      label: 'Surveys',
      type: 'folder',
      children: [
        { id: 'form-1', label: 'Onboarding', type: 'document', formId: '1' },
        { id: 'form-2', label: 'Exit Interview', type: 'document', formId: '2' },
      ],
    },
    { id: 'form-3', label: 'Standalone', type: 'document', formId: '3' },
  ]
}

// Three levels deep, so depth-sensitive logic (findParentFolderId, getFolderPath)
// can't accidentally pass by only ever being tested one level down.
function deepTree(): ProjectTreeItem[] {
  return [
    {
      id: 'folder-a',
      label: 'A',
      type: 'folder',
      open: true,
      children: [
        {
          id: 'folder-b',
          label: 'B',
          type: 'folder',
          children: [
            { id: 'form-x', label: 'X', type: 'document', formId: '99' },
          ],
        },
      ],
    },
  ]
}

describe('findProjectById', () => {
  it('finds a nested document by its node id', () => {
    expect(findProjectById(tree(), 'form-1')?.label).toBe('Onboarding')
  })

  it('finds a document by its formId', () => {
    expect(findProjectById(tree(), '2')?.label).toBe('Exit Interview')
  })

  it('returns null when nothing matches', () => {
    expect(findProjectById(tree(), 'does-not-exist')).toBeNull()
  })
})

describe('findFolderById', () => {
  it('only matches folder-type nodes', () => {
    expect(findFolderById(tree(), 'folder-1')?.type).toBe('folder')
    expect(findFolderById(tree(), 'form-1')).toBeNull()
  })
})

describe('removeProjectById', () => {
  it('removes a nested document and reports it', () => {
    const { projects, removedProject } = removeProjectById(tree(), 'form-1')
    expect(removedProject?.id).toBe('form-1')
    expect(findProjectById(projects, 'form-1')).toBeNull()
    expect(findProjectById(projects, 'form-2')).not.toBeNull()
  })

  it('reports null when the id is not found', () => {
    const { removedProject } = removeProjectById(tree(), 'missing')
    expect(removedProject).toBeNull()
  })
})

describe('removeFolderPromotingChildren', () => {
  it('keeps children, promoted to where the folder lived', () => {
    const result = removeFolderPromotingChildren(tree(), 'folder-1')
    expect(findFolderById(result, 'folder-1')).toBeNull()
    expect(result.some((item) => item.id === 'form-1')).toBe(true)
    expect(result.some((item) => item.id === 'form-2')).toBe(true)
  })
})

describe('isNameTaken / uniqueName', () => {
  it('is case-insensitive within the same scope', () => {
    const taken = isNameTaken(tree(), 'standalone', {
      parentFolderId: null,
      type: 'document',
    })
    expect(taken).toBe(true)
  })

  it('does not collide across different containers', () => {
    const taken = isNameTaken(tree(), 'Standalone', {
      parentFolderId: 'folder-1',
      type: 'document',
    })
    expect(taken).toBe(false)
  })

  it('appends an incrementing suffix until the name is free', () => {
    const name = uniqueName(tree(), 'Standalone', {
      parentFolderId: null,
      type: 'document',
    })
    expect(name).toBe('Standalone (2)')
  })

  it('returns the trimmed name unchanged when not taken', () => {
    const name = uniqueName(tree(), 'Brand New Form', {
      parentFolderId: null,
      type: 'document',
    })
    expect(name).toBe('Brand New Form')
  })

  it('treats a name that already ends in "(2)" as its own literal name, not a suffix to bump', () => {
    // Renaming something to collide with an existing "X (2)" should produce
    // "X (2) (2)", not skip ahead to "X (3)" — uniqueName has no idea "(2)"
    // was itself generated, it just sees a taken string.
    const projects: ProjectTreeItem[] = [
      { id: 'a', label: 'Form (2)', type: 'document' },
    ]
    const name = uniqueName(projects, 'Form (2)', { parentFolderId: null, type: 'document' })
    expect(name).toBe('Form (2) (2)')
  })

  it('is insensitive to surrounding whitespace', () => {
    const taken = isNameTaken(tree(), '  Standalone  ', {
      parentFolderId: null,
      type: 'document',
    })
    expect(taken).toBe(true)
  })
})

describe('empty tree', () => {
  it('every lookup/mutation handles [] without throwing', () => {
    expect(findProjectById([], 'x')).toBeNull()
    expect(findFolderById([], 'x')).toBeNull()
    expect(removeProjectById([], 'x')).toEqual({ projects: [], removedProject: null })
    expect(removeFolderPromotingChildren([], 'x')).toEqual([])
    expect(getFolderPath([], 'x')).toEqual([])
    expect(findParentFolderId([], 'x')).toBeNull()
    expect(getDefaultOpenFolderIds([])).toEqual(new Set())
    expect(addProjectToRoot([], { id: 'a', label: 'A', type: 'document' })).toHaveLength(1)
  })
})

describe('formNodeId', () => {
  it('prefixes a string or number db id the same way', () => {
    expect(formNodeId('42')).toBe('form-42')
    expect(formNodeId(42)).toBe('form-42')
  })
})

describe('isIdWithinItem', () => {
  it('matches the item itself', () => {
    const [folderA] = deepTree()
    expect(isIdWithinItem(folderA, 'folder-a')).toBe(true)
  })

  it('matches a descendant at any depth', () => {
    const [folderA] = deepTree()
    expect(isIdWithinItem(folderA, 'form-x')).toBe(true)
  })

  it('returns false for an id outside the subtree', () => {
    const [folderA] = deepTree()
    expect(isIdWithinItem(folderA, 'form-3')).toBe(false)
  })
})

describe('getDefaultOpenFolderIds', () => {
  it('collects only folders flagged open, at any depth', () => {
    const ids = getDefaultOpenFolderIds(deepTree())
    expect(ids.has('folder-a')).toBe(true)
    expect(ids.has('folder-b')).toBe(false)
  })
})

describe('getSelectedProjectId', () => {
  it('extracts the id after /forms/', () => {
    expect(getSelectedProjectId('/forms/form-1')).toBe('form-1')
  })

  it('extracts the id after /files/', () => {
    expect(getSelectedProjectId('/files/folder-1')).toBe('folder-1')
  })

  it('stops at the next path segment', () => {
    expect(getSelectedProjectId('/forms/form-1/dashboard')).toBe('form-1')
  })

  it('decodes URL-encoded ids', () => {
    expect(getSelectedProjectId('/files/folder%20a')).toBe('folder a')
  })

  it('returns empty string for a route matching neither prefix', () => {
    expect(getSelectedProjectId('/create-form')).toBe('')
  })

  it('returns empty string for a trailing-slash-only match', () => {
    expect(getSelectedProjectId('/forms/')).toBe('')
  })
})

describe('getFolderPath', () => {
  it('returns the full chain from root to the target folder, inclusive', () => {
    const path = getFolderPath(deepTree(), 'folder-b')
    expect(path.map((p) => p.id)).toEqual(['folder-a', 'folder-b'])
  })

  it('returns just the folder itself when it is at the root', () => {
    const path = getFolderPath(deepTree(), 'folder-a')
    expect(path.map((p) => p.id)).toEqual(['folder-a'])
  })

  it('returns an empty array for a document id (not a folder)', () => {
    expect(getFolderPath(deepTree(), 'form-x')).toEqual([])
  })

  it('returns an empty array when the folder does not exist', () => {
    expect(getFolderPath(deepTree(), 'missing')).toEqual([])
  })
})

describe('findParentFolderId', () => {
  it('returns null for a root-level item', () => {
    expect(findParentFolderId(deepTree(), 'folder-a')).toBeNull()
  })

  it('returns the immediate parent, not the top-level ancestor, for a deeply nested item', () => {
    // form-x is inside folder-b, which is inside folder-a — the direct
    // parent must be folder-b, not folder-a.
    expect(findParentFolderId(deepTree(), 'form-x')).toBe('folder-b')
  })

  it('returns the immediate parent for a nested folder', () => {
    expect(findParentFolderId(deepTree(), 'folder-b')).toBe('folder-a')
  })

  it('returns null when the id is not found at all', () => {
    expect(findParentFolderId(deepTree(), 'missing')).toBeNull()
  })
})

describe('renameProjectById', () => {
  it('renames a root-level item', () => {
    const result = renameProjectById(tree(), 'form-3', 'Renamed')
    expect(findProjectById(result, 'form-3')?.label).toBe('Renamed')
  })

  it('renames a nested item without disturbing its siblings', () => {
    const result = renameProjectById(tree(), 'form-1', 'Renamed')
    expect(findProjectById(result, 'form-1')?.label).toBe('Renamed')
    expect(findProjectById(result, 'form-2')?.label).toBe('Exit Interview')
  })

  it('is a no-op when the id is not found', () => {
    const result = renameProjectById(tree(), 'missing', 'Renamed')
    expect(result).toEqual(tree())
  })
})

describe('addProjectToRoot', () => {
  it('appends to the end when no beforeId is given', () => {
    const result = addProjectToRoot(tree(), { id: 'new', label: 'New', type: 'document' })
    expect(result[result.length - 1].id).toBe('new')
  })

  it('inserts just before the given sibling', () => {
    const result = addProjectToRoot(tree(), { id: 'new', label: 'New', type: 'document' }, 'form-3')
    const ids = result.map((p) => p.id)
    expect(ids.indexOf('new')).toBe(ids.indexOf('form-3') - 1)
  })

  it('falls back to appending when beforeId does not match any current sibling', () => {
    const result = addProjectToRoot(tree(), { id: 'new', label: 'New', type: 'document' }, 'does-not-exist')
    expect(result[result.length - 1].id).toBe('new')
  })
})

describe('addProjectToFolder', () => {
  it('adds into the named folder’s children', () => {
    const result = addProjectToFolder(tree(), 'folder-1', { id: 'new', label: 'New', type: 'document' })
    const folder = findFolderById(result, 'folder-1')
    expect(folder?.children?.some((c) => c.id === 'new')).toBe(true)
  })

  it('does not add anywhere when the target folder id does not exist', () => {
    const result = addProjectToFolder(tree(), 'missing-folder', { id: 'new', label: 'New', type: 'document' })
    expect(findProjectById(result, 'new')).toBeNull()
  })
})
