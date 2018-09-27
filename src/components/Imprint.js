import React from 'react';
import PropTypes from 'prop-types';
import injectSheet from 'react-jss'; // eslint-disable-line


const styles = theme => ({ // eslint-disable-line
  text: {
    fontSize: '1.2rem',
  },
  close: {
    fontSize: '1.3rem',
    textAlign: 'right',
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
  componentDidMount() {
    window.scrollTo(0, 0);
  }
  render() {
    const {
      classes,
      visible,
      onClose,
    } = this.props;
    if (!visible) return null;
    return (
      <div>
        <div className={classes.content}>
          <div
            className={classes.close}
            onMouseDown={onClose}
          >
            close
          </div>
          <h4 data-hidden>Impressum</h4>
          <p data-hidden className={classes.text}>
            Markus Kerschkewicz <br />
            Lilienthalstr. 16 <br />
            10965 Berlin
          </p>
          <h4>Privacy Policy</h4>
          <h6>
            General
          </h6>
          <p className={classes.text}>
            This website does not actively collect any data about your browsing.
          </p>
          <h6>Cookies</h6>
          <p className={classes.text}>
            This website does not actively use any cookies. If you want to make sure that cookies are not generated you can deactivate cookies in your browser settings.
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
            For the sake of beauty this website uses fonts from Google Webfonts. The fonts will be loaded into your browsers cache. Since this is third party library I have no liability about which data Google is collecting about you. You can deactivate cookies or third party services in your browser settings. For more informations about what Google does collect about you read Googles <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/intl/de_de/help/terms_maps.html">Terms and Conditions</a> and <a target="_blank" rel="noopener noreferrer" href="https://policies.google.com/privacy">Privacy Policy</a>
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
