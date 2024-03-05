import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent } from '@progress/kendo-react-layout';
// import {
//     useLocalization
// } from "@progress/kendo-react-intl";
import { Header } from './../Header/Header';
import { gridIcon, calendarIcon, userIcon, infoCircleIcon} from '@progress/kendo-svg-icons'

const items = [
    { name: 'home', svgIcon: gridIcon, route: '/home', selected: true },
    { name: 'simple', svgIcon: calendarIcon, route: '/simple', selected: false },
    { name: 'multi', svgIcon: userIcon, route: '/multi', selected: false },
    { separator: true },
    { name: 'info', svgIcon: infoCircleIcon, route: '/test', selected: false }
];

export default function DrawerRouterContainer(props: any): JSX.Element {

    const navigate = useNavigate();
    //const localization = useLocalization();

    const [expanded, setExpanded] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState(items.findIndex(x => x.selected === true));
    const [isSmallerScreen, setIsSmallerScreen] = React.useState(window.innerWidth < 768);

    const resizeWindow = () => {
        setIsSmallerScreen(window.innerWidth < 768);
    }

    const handleClick = (e: any) => {
        setExpanded(!expanded);
    }

    const handleSelect = (e: any) => {
        setSelectedId(e.itemIndex);
        setExpanded(false);
        navigate(e.itemTarget.props.route);
    }

    React.useEffect(() => {
        window.addEventListener('resize', resizeWindow, false)
        resizeWindow();
    }, [])

    return (
        <React.Fragment>
            <Header
                onButtonClick={handleClick}
            />
            <Drawer
                expanded={expanded}
                animation={{ duration: 100 }}
                items={items.map((item, index) => ({
                    ...item,
                    text: item.name,
                    selected: index === selectedId,
                    tabIndex: index + 2000
                }))
                }
                position='start'
                mode={isSmallerScreen ? 'overlay' : 'push'}
                mini={isSmallerScreen ? false : true}

                onOverlayClick={handleClick}
                onSelect={handleSelect}
            >
                <DrawerContent>
                    {props.children}
                </DrawerContent>
            </Drawer>
        </React.Fragment>
    )
}
