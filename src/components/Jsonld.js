import React from "react"
import Helmet from "react-helmet"

const JsonLd = ({ children }) => {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(children)}</script>
    </Helmet>
  )
}

export default JsonLd
