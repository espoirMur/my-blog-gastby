/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/profile-pic.jpg/" }) {
        childImageSharp {
          fixed(width: 50, height: 50) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author
        }
      }
    }
  `)

  const { author } = data.site.siteMetadata
  return (
    <div
      style={{
        display: `flex`,
        marginBottom: rhythm(2.5),
      }}
    >
      <Image
        fixed={data.avatar.childImageSharp.fixed}
        alt={author}
        style={{
          marginRight: rhythm(1 / 2),
          marginBottom: 0,
          minWidth: 50,
          borderRadius: `100%`,
        }}
        imgStyle={{
          borderRadius: `50%`,
        }}
      />{" "}
      <p>
        Written by <strong> {author} </strong> , a Engineer from DRC{" "}
        <span class="flag-icon flag-icon-cd"></span> who is currently living and
        working in Rwanda <span class="flag-icon flag-icon-cd"> . </span>
        {` `} You Can find his Resume
        <a
          href={`https://drive.google.com/file/d/18vMKkRFF3vWu1dy8DmZ9jDB1Ly3L1J0m/view`}
        >
          here{" "}
        </a>{" "}
      </p>{" "}
    </div>
  )
}

export default Bio
