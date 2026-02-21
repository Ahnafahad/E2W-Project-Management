import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8')
const MONGODB_URI = envContent.match(/MONGODB_URI=(.+)/)[1].trim()

await mongoose.connect(MONGODB_URI)

const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  email: String, password: String, name: String, accessMode: String
}))

const u = await User.findOne({ email: 'abdullah.26nasir@gmail.com' }).lean()
if (!u) { console.log('NOT FOUND'); process.exit(1) }

const match = await bcrypt.compare('123456', u.password)
console.log({ name: u.name, email: u.email, accessMode: u.accessMode, passwordOk: match })

await mongoose.disconnect()
