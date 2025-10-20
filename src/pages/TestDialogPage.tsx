import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { useState } from 'react';
import './TestDialogPage.scss'

export default function TestDialogPage(): JSX.Element {
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <div className="test-dialog-page">
            <h1>Welcome DialogTest</h1>
            <button onClick={() => setVisible(true)}>Open Dialog</button>
            {
                visible &&
                <Dialog
                    autoFocus
                    title={"Ma dialog avec titre long"}
                    className="my-dialog"
                >
                    <p>Coucou</p>
                    <p>je suis super long comme texte et je serai plus long que le titre</p>
                    <div className="sized">&nbsp;</div>
                    <DialogActionsBar layout='center'>
                        <button onClick={() => setVisible(false)}>Close Dialog</button>
                    </DialogActionsBar>
                </Dialog>
            }
        </div>
    );
}
