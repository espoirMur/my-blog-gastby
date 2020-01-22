import React, { Component } from "react"
import { Link } from "gatsby"
import "../../static/css/navbar.css"

export default class NavBar extends Component {
  render() {
    return (
      <nav class="navigation">
        <div class="container">
          <ul class="navigation-links">
            <li>
              {" "}
              <Link to={`/`}>Home</Link>{" "}
            </li>
            <li>
              {" "}
              <Link to={`/blog`}>Blog</Link>{" "}
            </li>
            <li>
              <a
                target="_blank"
                href="https://drive.google.com/file/d/18vMKkRFF3vWu1dy8DmZ9jDB1Ly3L1J0m/view"
                rel="noopener noreferrer"
              >
                Resume
              </a>
            </li>
          </ul>
        </div>
      </nav>
    )
  }
}
