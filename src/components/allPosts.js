import React, { Component } from "react"
import { Link, graphql } from "gatsby"
import Layout from "./layout"
import SEO from "./seo"
import { rhythm } from "../utils/typography"
import Img from "gatsby-image"

class AllPosts extends Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO title="All posts" />
        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          const featuredimage = node.frontmatter.featuredimage
          return (
            <article key={node.fields.slug}>
              <header>
                <h3
                  style={{
                    marginBottom: rhythm(1 / 4),
                  }}
                >
                  <Link
                    style={{
                      boxShadow: `none`,
                    }}
                    to={node.fields.slug}
                  >
                    {" "}
                    {title}{" "}
                  </Link>{" "}
                </h3>{" "}
                <small> {node.frontmatter.date} </small>{" "}
              </header>{" "}
              {featuredimage && (
                <Img
                  fluid={featuredimage.src.childImageSharp.fluid}
                  alt={featuredimage.alt}
                />
              )}
              <section>
                <p
                  dangerouslySetInnerHTML={{
                    __html: node.frontmatter.description || node.excerpt,
                  }}
                />{" "}
              </section>{" "}
            </article>
          )
        })}{" "}
      </Layout>
    )
  }
}

export default AllPosts

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { published: { eq: true } } }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "DD MMMM, YYYY")
            title
            description
            featuredimage {
              src {
                childImageSharp {
                  fluid(maxWidth: 1024) {
                    ...GatsbyImageSharpFluid
                  }
                }
              }
              alt
            }
          }
        }
      }
    }
  }
`
