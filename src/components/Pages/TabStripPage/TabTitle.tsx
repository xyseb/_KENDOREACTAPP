
export default function TabTitle(props: { label: string; displayCount: number }): JSX.Element
{
    // Ce composant peut re-render sans impacter le Tab
    return (
        <h1>
            {props.label} – affiché {props.displayCount} fois
        </h1>
    );
}
