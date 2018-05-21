import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import injectSheet from 'react-jss'; // eslint-disable-line


const styles = theme => ({ // eslint-disable-line
  imprint: {
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    background: theme.background,
    overflow: 'auto',
  },
  text: {
    fontSize: '1.2rem',
  },
  content: {
    padding: theme.spacing.unit * 7,
  },
  close: {
    fontSize: '1.5rem',
    position: 'absolute',
    top: theme.spacing.unit * 3,
    right: theme.spacing.unit * 7,
    color: theme.primary,
    cursor: 'pointer',
  },
});

class Imprint extends React.Component { // eslint-disable-line
  static propTypes = {
    classes: PropTypes.object.isRequired,
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
  }
  render() {
    const {
      classes,
      visible,
      onClose,
    } = this.props;
    if (!visible) return null;
    return (
      <div
        className={cx(
          classes.imprint,
        )}
      >
        <div className={classes.content}>
          <div
            className={classes.close}
            onMouseDown={onClose}
          >
            close
          </div>
          <h4>Impressum</h4>
          <p className={classes.text}>
            Markus Kerschkewicz <br />
            Lilienthalstr. 16 <br />
            10965 Berlin
          </p>
          <h4>Privacy Policy</h4>
          <h6>
            General
          </h6>
          <p className={classes.text}>
            This website does not use any technology that collects data.
          </p>
          <h6>
            SSL-Encryption
          </h6>
          <p className={classes.text}>
            This websites uses SSL-Encryption via HTTPS.
          </p>
          <h6>
            Google-Fonts
          </h6>
          <p className={classes.text}>
            For the sake of beauty this website uses fonts from <a href="https://www.google.com/webfonts/">Google Webfonts</a>. The fonts will be loaded into your browsers cache. You can deactivate the cache or disallow the access to Google Webfonts. Since this is a thrid party library there is the potential of Google Webfonts collecting information.
          </p>
          <h6>
            Further information
          </h6>
          <p className={classes.text}>
            If there is any question left just get in touch via email.
          </p>
        </div>
      </div>
    );
  }
}

export default injectSheet(styles)(Imprint);
