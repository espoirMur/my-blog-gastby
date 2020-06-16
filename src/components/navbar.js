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
                href="https://drive.google.com/file/d/14yle0nyGH_Kyk7L67nvqwl90FobvY7W0/view?usp=sharing"
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
