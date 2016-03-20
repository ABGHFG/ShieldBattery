import constants from '../../shared/constants'
import bcrypt from 'bcrypt'
import httpErrors from 'http-errors'
import thenify from 'thenify'
import users from '../models/users'
import initSession from '../session/init'
import setReturningCookie from '../session/set-returning-cookie'
import checkPermissions from '../permissions/check-permissions'

export default function(router) {
  router.post('/', createUser)
    .get('/:searchTerm', checkPermissions(['editPermissions']), find)
    .put('/:id', function* (next) {
      // TODO(tec27): update a user
      throw new httpErrors.ImATeapot()
    })
}

function* find(next) {
  const searchTerm = this.params.searchTerm

  try {
    const user = yield* users.find(searchTerm)
    this.body = user ? [ user ] : []
  } catch (err) {
    this.log.error({ err }, 'error finding user by name')
    throw err
  }
}

const bcryptHash = thenify(bcrypt.hash)
function* createUser(next) {
  const { username, email, password } = this.request.body

  if (!constants.isValidUsername(username) ||
      !constants.isValidEmail(email) ||
      !constants.isValidPassword(password)) {
    throw new httpErrors.BadRequest('Invalid parameters')
  }

  let hashed
  try {
    hashed = yield bcryptHash(password, 10)
  } catch (err) {
    this.log.error({ err }, 'error hashing password')
    throw err
  }

  let result
  try {
    const user = users.create(username, email, hashed)
    result = yield* user.save()
  } catch (err) {
    if (err.code && err.code === 23505) {
      // TODO(tec27): this is a nasty check, we should find a better way of dealing with this
      throw new httpErrors.Conflict('A user with that name already exists')
    }
    this.log.error({ err }, 'error saving user')
    throw err
  }

  // regenerate the session to ensure that logged in sessions and anonymous sessions don't
  // share a session ID
  yield this.regenerateSession()
  initSession(this, result.user, result.permissions)
  setReturningCookie(this)
  this.body = result
}
