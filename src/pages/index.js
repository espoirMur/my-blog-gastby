import React, { Component } from "react"
import NavBar from "../components/navbar"
import "../../static/css/about.css"
import { rhythm } from "../utils/typography"
import myProfile from "../../content/assets/profile-pic.jpg"
import SEO from "../components/seo"

export default class AboutMe extends Component {
  render() {
    return (
      <main>
        <SEO title="Murhabazi Buzina Espoir Home" />
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
                  Hey, Internet !! It's me Espoir Murhabazi, a Software Engineer
                  from DRC, but currently based in Rwanda! I am in a serious
                  relationship with Python language, but I also write Javascript
                  and sometimes Java. I greatly value clean and maintainable
                  code, great software, but I know when I need to be a
                  perfectionist and when it stands in the way of product
                  delivery.
                </p>
                <p>
                  I am also interested in Data Science and Machine Learning
                  especially Recommendations Engines, Natural Language
                  Processing, and sometimes Neural Machine Translation.
                </p>
                <p>
                  When not coding, you can find me watching football and
                  supporting ManCity, tweaking my FPL team, listening to
                  Congolese Music, helping people to learn about the Bible or
                  just spending time with my family!
                </p>
              </div>
              <p id="pright">
                I love sharing my knowledge on , &nbsp;
                <a href="https://stackoverflow.com/users/4683950/espoir-murhabazi">
                  StackOverflow
                </a>
                , <a href="https://dev.to/espoir"> The PracticalDev </a>,{" "}
                <a href="https://github.com/espoirMur"> Github </a> , and during
                local meetups at different communities
              </p>
              <ul>
                <li>
                  <a href="https://stackoverflow.com/questions/34818723/export-notebook-to-pdf-without-code/45029786#45029786">
                    My best Answer on StackOverflow
                  </a>
                </li>
              </ul>
              <p>
                Feel free to contact me at : <a target="_blank" href="https://mailhide.io/e/kSXIE">{{result.shortenUrlComposed}}</a> for any inquiry!
              </p>
            </div>
          </div>
          <footer>
            © {new Date().getFullYear()}, Build by Espy Mur Using Gastby
          </footer>
        </div>
      </main>
    )
  }
}
