const babel = require('@babel/core')
const mdx = require('../index')
const mdxHastToJsx = require('../mdx-hast-to-jsx')
const fs = require('fs')
const path = require('path')
const { select } = require('hast-util-select')
const requestImageSize = require('request-image-size')

const fixtureBlogPost = fs.readFileSync(
  path.join(__dirname, './fixtures/blog-post.md')
)

const parse = code => babel.parse(code, {
  plugins: ['@babel/plugin-syntax-jsx']
})

it('Should output parseable JSX', async () => {
  const result = await mdx('Hello World')

  parse(result)
})

it('Should output parseable JSX when using < or >', async () => {
  const result = await mdx(`
  # Hello, MDX

  I <3 Markdown and JSX
  `)

  parse(result)
})

it('Should compile sample blog post', async () => {
  const result = await mdx(fixtureBlogPost)

  parse(result)
})

it('Should render blockquote correctly', async () => {
  const result = await mdx('> test\n\n> `test`')

  parse(result)
})

it('Should render HTML inside inlineCode correctly', async () => {
  const result = await mdx('`<div>`')

  expect(
    result.includes(
      '<MDXTag name="inlineCode" components={components} parentName="p">{`<div>`}</MDXTag>'
    )
  ).toBeTruthy()
})

it('Should recognize components as propertiess', async () => {
  const result = await mdx('# Hello\n\n<MDX.Foo />')

  expect(
    result.includes(
      '<MDXTag name="h1" components={components}>{`Hello`}</MDXTag>{`\n`}<MDX.Foo />'
    )
  ).toBeTruthy()
})

test('Should await and render async plugins', async () => {
  const result = await mdx(fixtureBlogPost, {
    hastPlugins: [
      options => tree => {
        return (async () => {
          const headingNode = select('h1', tree)
          const textNode = headingNode.children[0]
          textNode.value = textNode.value.toUpperCase()
        })()
      }
    ]
  })

  expect(result).toMatch(/HELLO, WORLD!/)
})

test('Should parse and render footnotes', async () => {
  const result = await mdx('This is a paragraph with a [^footnote]\n\n[^footnote]: Here is the footnote')

  expect(
    result.includes(
      '<MDXTag name="sup" components={components} parentName="p" props={{"id":"fnref-footnote"}}>'
    )
  )

  expect(
    result.includes(
      '<MDXTag name="li" components={components} parentName="ol" props={{"id":"fn-footnote"}}>'
    )
  )
})

test('Should expose a sync compiler', async () => {
  const result = mdx.sync(fixtureBlogPost)

  console.log(result)

  expect(result).toMatch(/Hello, world!/)
})
