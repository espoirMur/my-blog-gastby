import React, { Component } from "react"

class Comments extends Component {
  constructor(props) {
    super(props)
    this.commentBox = React.createRef() // Creates a reference to inject the <script> element
  }
  componentDidMount() {
    const utteranceTheme = "github-dark"
    let scriptEl = document.createElement("script")
    scriptEl.setAttribute("src", "https://utteranc.es/client.js")
    scriptEl.setAttribute("crossorigin", "anonymous")
    scriptEl.setAttribute("async", true)
    scriptEl.setAttribute("repo", "espoirMur/espoirMur.github.io")
    scriptEl.setAttribute("issue-term", "pathname")
    scriptEl.setAttribute("theme", utteranceTheme)
    this.commentBox.current.appendChild(scriptEl)
  }

  render() {
    return (
      <div className="comment-box-wrapper container pt-7">
        <h1 className="mb-0">Comments</h1>
        <hr className="my-0" />
        <div ref={this.commentBox} className="comment-box" />
        {/* Above element is where the comments are injected */}
      </div>
    )
  }
}

export default Comments
