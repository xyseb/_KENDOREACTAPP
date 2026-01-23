import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerItemProps } from '@progress/kendo-react-layout';
// import {
//     useLocalization
// } from "@progress/kendo-react-intl";
import { Header } from './../Header/Header';
import { homeIcon, pageHeaderSectionIcon, fileIcon, windowRestoreIcon, windowIcon, crosstabWizardIcon, crosstabIcon, thumbnailsUpIcon, tellAFriendBoxIcon, xIcon } from '@progress/kendo-svg-icons'

const items: DrawerItemProps[] = [
    { name: "close", svgIcon: xIcon, selected: false },
    { name: 'home', svgIcon: homeIcon, route: '/home', selected: true },
    { name: 'simple', svgIcon: fileIcon, route: '/simple', selected: false },
    { name: 'multi', svgIcon: pageHeaderSectionIcon, route: '/multi', selected: false },
    { separator: true },
    { name: 'info', svgIcon: windowRestoreIcon, route: '/test-dialog', selected: false },
    { name: 'info', svgIcon: windowIcon, route: '/test-dialog', selected: false },
    { separator: true },
    { name: 'tabStrip', svgIcon: thumbnailsUpIcon, route: '/tabstrip', selected: false },
    { separator: true },
    { name: 'gridhelper', svgIcon: tellAFriendBoxIcon, route: '/gridhelper', selected: false },
    { name: 'grid', svgIcon: crosstabIcon, route: '/grid', selected: false },
    { name: 'hgrid', svgIcon: crosstabWizardIcon, route: '/hgrid', selected: false },
    { name: 'hgridtest', svgIcon: crosstabWizardIcon, route: '/hgridtest', selected: false },
];

export default function DrawerRouterContainer(props: any): JSX.Element {

    const navigate = useNavigate();
    //const localization = useLocalization();

    const [expanded, setExpanded] = useState(false);
    const [selectedId, setSelectedId] = useState(items.findIndex(x => x.selected === true));
    const [isSmallerScreen, setIsSmallerScreen] = useState(window.innerWidth < 768);

    const handleClick = (e: any) => {
        setExpanded(!expanded);
    }

    const handleSelect = (e: any) => {
        if (!isSmallerScreen) {
            setSelectedId(e.itemIndex);
            setExpanded(false);
            navigate(e.itemTarget.props.route);
        }
        else {
            if (e.itemIndex !== 0) {
                setSelectedId(e.itemIndex);
                setExpanded(false);
                navigate(e.itemTarget.props.route);
            }
            else {
                setExpanded(false);
            }
        }
    }
    
    const resizeWindow = () => {
        setIsSmallerScreen(window.innerWidth < 768);
    }

    useEffect(() => {
        window.addEventListener('resize', resizeWindow, false)
        resizeWindow();
    }, [])

    return (
        <>
            <Header
                onButtonClick={handleClick}
            />
            <Drawer
                expanded={expanded}
                animation={{ duration: 100 }}
                items={items.map((item, index) => ({
                    ...item,
                    text: item.name,
                    selected: index === selectedId
                })).filter((item, index) => !isSmallerScreen && index !== 0 || isSmallerScreen)
                }
                position='start'
                mode={isSmallerScreen ? 'overlay' : 'push'}
                mini={isSmallerScreen ? false : true}

                onOverlayClick={handleClick}
                onSelect={handleSelect}
            >
                <DrawerContent style={{ height: 1066 }}>
                    {props.children}
                </DrawerContent>
            </Drawer>
        </>
    )
}
