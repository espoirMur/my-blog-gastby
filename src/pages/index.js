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
                  Hello, My name is Espoir Murhabazi and I am a Software
                  Engineer from the Democratic Republic of Congo (DRC)! I am in
                  a serious relationship with the Python language, but I also
                  write Javascript and sometimes Java. I greatly value clean,
                  maintainable code and great software, but I know when I need
                  to stop being a perfectionist and focus on product delivery.
                </p>
                <p>
                  I am also interested in Data Science and Machine Learning
                  especially Recommendations Engines, Natural Language
                  Processing and sometimes Neural Machine Translation.
                </p>
                <p>
                  When not coding, you can find me watching football and
                  supporting Manchester City, tweaking my FPL team, listening to
                  Congolese Music, helping people to learn about the Bible or
                  just spending time with my family!
                </p>
              </div>
              <ul>
                <a href="https://stackoverflow.com/users/4683950/espoir-murhabazi?theme=dark">
                  <img
                    src="https://stackoverflow.com/users/flair/4683950.png"
                    width="208"
                    height="58"
                    alt="profile for Espoir Murhabazi at Stack Overflow, Q&amp;A for professional and enthusiast programmers"
                    title="profile for Espoir Murhabazi at Stack Overflow, Q&amp;A for professional and enthusiast programmers"
                  />
                </a>
              </ul>
              <p>
                Checkout{" "}
                <a
                  target="_blank"
                  href="https://mailhide.io/e/kSXIE"
                  rel="noreferrer"
                >
                  my email{" "}
                </a>
                address: For any inquiry
              </p>
            </div>
          </div>
          <footer>
            © {new Date().getFullYear()}, Build by Espy Mur Using
            <a href="https://www.gatsbyjs.com/"> Gastby Js</a>
          </footer>
        </div>
      </main>
    )
  }
}
