
import * as PropTypes from 'prop-types';

import { DropDownList } from '@progress/kendo-react-dropdowns';

import { locales } from './../../resources/locales';

import { SvgIcon } from '@progress/kendo-react-common';
import { menuIcon } from '@progress/kendo-svg-icons';

export const Header = (props: any) => {
    const { onButtonClick } = props;

    const localeId = "fr"
    const currentLanguage = locales.find(item => item.localeId === localeId);

    const onLanguageChange = () => {}
    return (
        <header className="header">
            <div className="nav-container">
                <div className="menu-button">
                    <SvgIcon icon={menuIcon} onClick={onButtonClick} />
                </div>

                <div className="title">
                    <h1>Mon jolie site</h1>
                </div>
                <div className="settings">
                    <span style={{ padding: '20px' }}>Langage</span>
                    <DropDownList
                        textField={'locale'}
                        dataItemKey={'localeId'}
                        data={locales}
                        value={currentLanguage}
                        onChange={onLanguageChange}
                    />
                </div>
            </div>
        </header>
    );
}

Header.displayName = 'Header';
Header.propTypes = {
    page: PropTypes.string,
    onButtonClick: PropTypes.func
};