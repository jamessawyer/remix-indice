import invariant from "tiny-invariant"

export function getEnv() {
  invariant(process.env.ADMIN_EMAIL, 'ADMIN_EMAIL should not be empty')
  return {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  }
}

type ENV = ReturnType<typeof getEnv>

declare global {
  var ENV: ENV;
  interface window {
    ENV: ENV;
  }
}
