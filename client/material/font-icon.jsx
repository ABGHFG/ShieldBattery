import React from 'react'

class FontIcon extends React.Component {
  render() {
    let classes = 'material-icons'
    if (this.props.size) {
      classes += ' md-' + size
    }

    return <i className={classes}>{this.props.children}</i>
  }
}

export default FontIcon