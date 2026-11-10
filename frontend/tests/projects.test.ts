import assert from 'node:assert/strict'
import test from 'node:test'
import { filterProjects } from '../lib/local-projects'
import type { APIProject } from '../lib/projectcraft-api-types'

const projects = Array.from({ length: 35 }, (_, i) => ({
  id: i, title: `Project ${i}`, description: 'Arduino', difficulty: 'Beginner',
})) as APIProject[]

test('catalog total counts every match before pagination', () => {
  assert.equal(filterProjects(projects, { search: 'Arduino', limit: Infinity }).length, 35)
  assert.equal(filterProjects(projects, { limit: 10, offset: 30 }).length, 5)
})
