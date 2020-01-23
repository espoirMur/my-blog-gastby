import React, { Component } from "react"
import NavBar from "../components/navbar"
import "../../static/css/about.css"
import { rhythm } from "../utils/typography"

export default class AboutMe extends Component {
  render() {
    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: rhythm(24),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        <NavBar></NavBar>
        <div id="content">
          <div id="about">
            <div class="my-details">
              <div class="my-name">Espoir Mur</div>
              <img
                src="../../content/assets/profile-pic.jpg"
                alt="my-profile"
              ></img>
            </div>
            <div style={{ clear: "both" }} class="subhead">
              Here is Espoir, a Python and Javascript Software Engineer who is
              passionate about backend architectures, especially how to build
              scalable APIs, how to build pipelines to collect data from those
              APIs and how to build machine learning models that get insight
              from the data collected. He is In-between Software Engineering and
              Data Science. He holds a Bachelor's Degree in Computer Engineering
              with 3 years of experience in Software Engineering. He is a native
              French speaker.
            </div>
            <p id="pright">
              I love sharing my knowledge on ,
              <a href="https://stackoverflow.com/users/4683950/espoir-murhabazi">
                &nbsp; StackOverflow
              </a>
              , <a href="https://dev.to/espoir"> The PracticalDev </a>
              and <a href="https://github.com/espoirMur"> Github </a>
            </p>
            <ul>
              <li>
                <a href="https://stackoverflow.com/questions/34818723/export-notebook-to-pdf-without-code/45029786#45029786">
                  My best Answer on StackOverflow
                </a>
              </li>
            </ul>
            <p>
              Feel free to contact him at espoir.mur[at]gmail.com if you'd like
              for him to work for you!
            </p>
          </div>
        </div>
        <footer>© {new Date().getFullYear()}, Built by Espy Mur</footer>
      </div>
    )
  }
}
