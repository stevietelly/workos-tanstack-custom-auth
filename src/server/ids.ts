import { customAlphabet } from 'nanoid'

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'

export const newSlug = customAlphabet(alphabet, 10)
export const newId = customAlphabet(alphabet, 16)
