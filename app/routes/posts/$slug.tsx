import { marked } from 'marked'
import type { LoaderFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { json } from "@remix-run/node"
import { getPost } from '~/models/post.server'
import invariant from 'tiny-invariant'

type LoaderData = {
  title: string;
  html: string;
}

export const loader: LoaderFunction = async ({ params }) => {
  const { slug } = params

  invariant(slug, 'slug is not defined')
  const post = await getPost(slug)
  invariant(post, `post not found: ${slug}`)
  const html = marked(post.markdown)
  return json<LoaderData>({ title: post.title, html }) 
}

export default function PostRoute() {
  const { title, html } = useLoaderData() as LoaderData
  return (
    <main className="max-w-4xl mx-auto">
      <h1 className="my-6 text-3xl text-center border-b-2">{title}</h1>
      <div dangerouslySetInnerHTML={{__html: html}} />
    </main>
  )
}