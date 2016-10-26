asdbTurbo
===

[![license](https://img.shields.io/badge/License-GPL2%2B-blue.svg)](https://github.com/asdbthemes/asdbturbo/blob/master/LICENSE)
[![Travis](https://travis-ci.org/asdbthemes/asdbturbo.svg?branch=master)](https://travis-ci.org/asdbthemes/asdbturbo)



WordPress Theme for http://turbonsk.ru from WPBuild.ru

I feature some of the web's most exciting technologies like: [Gulp](http://gulpjs.com/), [LibSass](http://sass-lang.com/), [PostCSS](https://github.com/postcss/postcss), [Bourbon](http://bourbon.io/), [Neat](http://neat.bourbon.io/), and [BrowserSync](https://www.browsersync.io/) to help make your development process fast and efficient. I'm also accessible, passing both WCAG 2.0AA and Section 508 standards out of the box.

## Getting Started

### Prerequisites

Because I'm bundled with Gulp, basic knowledge of the command line and the following dependencies are required: [Node](http://nodejs.org/) and [Gulp CLI](https://github.com/gulpjs/gulp-cli) (`npm install -g gulp-cli`).

### Quick Start


### Advanced

If you want to set me up manually:

1) [Download](https://github.com/asdbtheme/asdbturbo/archive/master.zip) and extract the zip into your `wp-content/themes` directory and rename `asdbturbo-master` to fit your needs.


## Development

After you've installed and activated me. It's time to setup Gulp.

1) From the command line, change directories to your new theme directory

```bash
cd /your-project/wordpress/wp-content/themes/your-theme
```

2) Install Node dependencies

```bash
npm install
```

### Gulp Tasks

From the command line, type any of the following to perform an action:

`gulp watch` - Automatically handle changes to CSS, JS, SVGs, and image sprites. Also kicks off BrowserSync.

`gulp icons` - Minify, concatenate, and clean SVG icons.

`gulp i18n` - Scan the theme and create a POT file

`gulp sass:lint` - Run Sass against WordPress code standards

`gulp scripts` - Concatenate and minify javascript files

`gulp sprites` - Generate an image sprite and the associated Sass (sprite.png)

`gulp styles` - Compile, prefix, combine media queries, and minify CSS files

`gulp` - Runs the following tasks at the same time: i18n, icons, scripts, styles, sprites

## Contributing and Support

Your contributions and [support tickets](https://github.com/asdbthemes/asdbturbo/issues) are welcome.
