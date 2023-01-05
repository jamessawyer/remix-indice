import { Form, useActionData, useCatch, useLoaderData, useParams, useTransition } from '@remix-run/react'
import  { redirect, json } from '@remix-run/node'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { createPost, deletePost, getPost, updatePost } from '~/models/post.server'
import invariant from 'tiny-invariant'
import { requireAdminUser } from '~/session.server'
import type { Post } from '@prisma/client'

type LoadData = { post?: Post } 

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdminUser(request)
  if (params.slug === 'new') {
    // 如果是新建POST
    return json({})
  }

  invariant(params.slug, 'slug is required')
  // 否则表示编辑POST，将post数据回传
  const post = await getPost(params.slug)
  if (!post) {
    throw new Response('Not Found', { status: 404 })
  }
  return json<LoadData>({post})
}

type ActionData = {
  title: string | null,
  slug: string | null,
  markdown: string | null
} | undefined

// action运行在server端
export const action: ActionFunction = async ({ request, params }) => {
  await requireAdminUser(request)
  invariant(params.slug, 'slug is required')

  const formData = await request.formData()

  const intent = formData.get('intent')
  if (intent === 'delete') {
    await deletePost(params.slug)
    return redirect('/posts/admin')
  }
  
  const title = formData.get('title')
  const slug = formData.get('slug')
  const markdown = formData.get('markdown')

  const errors: ActionData = {
    title: title ? null : 'title is required',
    slug: slug ? null : 'slug is required',
    markdown: markdown ? null : 'markdown is required',
  }

  const hasErrors = Object.values(errors).some(errorMsg => errorMsg)
  if (hasErrors) {
    return json<ActionData>(errors)
  }

  invariant(typeof title === 'string', 'title must be a string')
  invariant(typeof slug === 'string', 'slug must be a string')
  invariant(typeof markdown === 'string', 'markdown must be a string')

  if (params.slug === 'new') {

    await createPost({ title, slug, markdown })
  } else {
    //  编辑POST
    await updatePost(params.slug, { title, slug, markdown })
  }

  // return new Response(null, {
  //   status: 302,
  //   headers: {
  //     Location: '/posts/admin'
  //   }
  // })
  return redirect('/posts/admin')
}

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`

export default function NewPostRoute() {
  const data = useLoaderData() as LoadData
  const errors = useActionData() as ActionData
  const transition = useTransition()
  const isUpdating = transition.submission?.formData.get('intent') === 'update'
  const isCreating = transition.submission?.formData.get('intent') === 'create'
  const isDeleting = transition.submission?.formData.get('intent') === 'delete'
  const isNewPost = !data.post // 是否是新的Post

  return (
    <Form method="post" key={data.post?.slug ?? 'new'}>
      <p>
        <label>
          Post Title: {errors?.title ? (<em className="text-red-600">{errors.title}</em>) : null}
          <input type="text" name="title" className={inputClassName} defaultValue={data.post?.title} />
        </label>
      </p>
      <p>
       <label>
          Post Slug: {errors?.slug ? (<em className="text-red-600">{errors.slug}</em>) : null}
          <input type="text" name="slug" className={inputClassName} defaultValue={data.post?.slug} />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown: {errors?.markdown ? (<em className="text-red-600">{errors.markdown}</em>) : null}
        </label>
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          defaultValue={data.post?.markdown}
          className={`${inputClassName} font-mono`}
         />
      </p>
      <div className="flex justify-end gap-4">
        {
          isNewPost ? null : (
            <button 
              type="submit"
              className="px-5 py-2 text-white bg-red-500 rounded disabled:bg-red-300"
              name="intent"
              value="delete"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )
        }
        <button 
          type="submit"
          className="px-5 py-2 text-white bg-blue-500 rounded disabled:bg-blue-300"
          name="intent"
          value={isNewPost ? 'create' : 'update'}
          disabled={isCreating || isUpdating}
        >
          {isNewPost ? (isCreating ? 'Creating...' : 'Create Post') : null}
          {isNewPost ? null : isUpdating ? 'Updating...' : 'Update'}
        </button>
      </div>
    </Form>
  )
}

export function CatchBoundary() {
  const caught = useCatch()
  const params = useParams()
  if (caught.status === 404) {
    return (
      <div>
        Un oh! The Post with the slug "{params.slug}" does not exist
      </div>
    )
  }

  throw new Error(`Unsupported thrown response status code: ${caught.status}`)
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="text-red-500">
      Oh no, something went wrong!
      <pre>{error.message}</pre>
    </div>
  )
}