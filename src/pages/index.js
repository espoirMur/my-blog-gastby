import React, { Component } from "react"
import NavBar from "../components/navbar"
import "../../static/css/about.css"
import { rhythm } from "../utils/typography"
import myProfile from "../../content/assets/profile-pic.jpg"

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
              <img src={myProfile} alt="my-profile"></img>
            </div>
            <div style={{ clear: "both" }} class="subhead">
              <p>
                Hey, Internet !! It's me Espoir Murhabazi a Software Engineer
                from DRC but currently based in Rwanda! I am in between Software
                Engineering and Data Science. Python is my favorite language ,
                but I also do JavaScript and sometimes Java(my first love).
              </p>
              <p>
                When not coding , you can find my playing fantasy football,
                listening to Rumba music from DRC or just spending time with my
                family!
              </p>
            </div>
            <p id="pright">
              I love sharing my knowledge on , &nbsp;
              <a href="https://stackoverflow.com/users/4683950/espoir-murhabazi">
                StackOverflow
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
              Feel free to contact me at espoir.mur[at]gmail.com if you'd like
              me to work for you!
            </p>
          </div>
        </div>
        <footer>© {new Date().getFullYear()}, Built by Espy Mur</footer>
      </div>
    )
  }
}
