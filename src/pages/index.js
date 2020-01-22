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
                src="http://3rdpartyservicesofflorida.com/wp-content/uploads/2015/03/blank-profile.jpg"
                alt="my-profile"
              ></img>
            </div>
            <h3 style={{ clear: "both" }} class="subhead">
              <a href="https://plus.google.com/108495471566196018473/posts">
                Zach
              </a>{" "}
              is an enthusiastic, young, self-taught web applications developer
              currently studying at the University of Georgia.
            </h3>
            <p id="pleft">
              He does freelance work, writes for{" "}
              <a href="https://css-tricks.com/css-animation-tricks/">CSS</a>{" "}
              <a href="https://css-tricks.com/controlling-css-animations-transitions-javascript/">
                Tricks
              </a>
              , worked at{" "}
              <a href="http://deltadatasoft.com/">Delta Data Software</a> as a
              front-end developer, and is continuously working on personal
              projects to up his game.
            </p>
            <p id="pright">
              Look for some of his work &amp; experiments on{" "}
              <a href="https://codepen.io/Zeaklous">CodePen</a>,{" "}
              <a href="http://stackoverflow.com/users/2065702/zeaklous">
                StackOverflow
              </a>
              , <a href="https://cssdeck.com/user/Zeaklous">CSS Deck</a>, or a
              bit of his recent work below.
            </p>
            <ul>
              <li>
                <a href="https://cssdeck.com/labs/css-only-full-page-slider">
                  CSS Only Full Page Slider
                </a>
              </li>
              <li>
                <a href="https://codepen.io/Zeaklous/pen/alpEm">
                  CSS3 Circular Questionnaire (Plugin in development)
                </a>
              </li>
              <li>
                <a href="https://zachsaucier.com/TumblrBook.html">TumblrBook</a>
              </li>
            </ul>
            <p>
              Feel free to contact him at zachsaucier[at]gmail.com if you'd like
              for him to work for you!
            </p>
          </div>
        </div>
        <footer>© {new Date().getFullYear()}, Built by Espy Mur</footer>
      </div>
    )
  }
}
