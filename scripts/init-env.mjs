import { copyFile } from 'node:fs/promises'
import { constants } from 'node:fs'
const source = new URL('../.env.local.example', import.meta.url)
const destination = new URL('../frontend/.env.local', import.meta.url)
try {
  await copyFile(source, destination, constants.COPYFILE_EXCL)
  console.log('Created frontend/.env.local')
} catch (error) {
  if (error.code !== 'EEXIST') throw error
  console.log('Keeping existing frontend/.env.local')
}
