# gatsby-plugin-react-social-cards 📸

This Gatsby plugin lets you create React components that can then be screenshotted and used as social card images.

This plugin was inspired by Maxence Poutord's post on [generating social share images with Gatsby](https://www.maxpou.fr/generate-social-image-share-with-gatsby).

## How does it work?

When you start up your Gatsby server with `gatsby develop`, the plugin creates Gatsby pages for all of your social card images using your provided React component. 

Then, it will take screenshots of all these pages with Puppeteer, and save them in your `static` folder.

## Setup instructions

> For more a more detailed explanation, view [my post on this plugin](https://www.emgoto.com/gatsby-react-social-cards/).

First, install the Gatsby plugin:

```bash
npm install gatsby-plugin-react-social-cards
# or
yarn add gatsby-plugin-react-social-cards
```

Then, add the plugin to your `gatsby-config.js` file:

```js
{
    plugins: [
        {
            resolve: `gatsby-plugin-react-social-cards`,
            options: {
                query: `
                    {
                        allMarkdownRemark {
                            nodes {
                                fields {
                                    slug
                                }
                                frontmatter {
                                    title
                                    description
                                }
                            }
                        }
                    }
                `,
                queryToPages: (result) => 
                    result.data.allMarkdownRemark.nodes.map(node => {
                        const slugWithoutSlashes = node.fields.slug.node.slug.replace(/\//g, '');
                        return {
                            slug: `/${slugWithoutSlashes}`,
                            pageContext: {
                                title: node.frontmatter.title,
                                coverImage: node.frontmatter.coverImage,
                            },
                        };
                    }),
                component: require.resolve('./src/components/social-card.js'),
                cardLimit: 0, // Useful for debugging.
            },
        },
    ]
}
```

The `query` and `queryToPages` will have to be modified depending upon your Gatsby site.


### Create your social card React component

Your React social card component will receive all the variables passed in via the `pageContext` object:

```jsx
// src/components/social-card.js

import React from 'react';

const SocialCard = ({ pageContext: { title, description, height, width } }) => {
    return <div>{title}</div>
}

export default SocialCard;
```

By default this React component will be opened and screenshotted at a 1200x628 resolution in Chrome. Make sure that it renders properly at this height and width.

### Testing your social card image

After completing the above steps, you can start up your Gatsby blog with `gatsby develop`.

You will be able to view the pages for your social cards at `localhost:8000/<your-post-slug>-social-card`.

You can change the `cardLimit` option to `1` to test a screenshot of one page.

After changing your `gatsby-config.js` file, your browser will prompt you to restart your server. I recommend instead that you manually **kill and start your Gatsby server** as I’ve found that when restarting, it will attempt to take the screenshot too early.

Once you are ready for all pages to be screenshotted, you can remove the `cardLimit` option altogether. All images will be saved in the `static` folder.

The next time you start `gatsby develop`, any pages that already have a social card image won’t have its social card page generated. If you want to re-take a screenshot, delete the image from your `static` folder.

### Optional options

* **imageFolder** - defaults to `'static'`. If you want to save your images to another folder
* **baseUrl** - defaults to `'http://localhost:8000'`. If you start your dev server on another port.
* **timeout** - defaults to `5000`. Milliseconds waited before the screenshot is taken. Increase this number if you need to wait for images to load, decrease if you find it's too slow.
* **dimensions** defaults to:
```js
[{
    width: 1200,
    height: 628,
    suffix: '-social-card'
}]
```
This lets you change the height and width, as well as let you screenshot multiple times per page at different dimensions.
The width and height will be passed in as values to the `pageContext` object of your React component.