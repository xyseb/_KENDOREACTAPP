import { useRef, useState } from 'react';
import './TestPage.scss'

import ApiResults from '../resources/searchresults.json';
import { Link } from 'react-router-dom';

interface IResult {
    id: string
    nom: string;
    prenom: string;
    age: number;
}
export default function TestPage(): JSX.Element {
    // État pour stocker la valeur de recherche
    const [searchTerm, setSearchTerm] = useState('');
    // État pour stocker les resultats de recherche
    const [searchResults, setSearchResults] = useState<IResult[]>([]);
    {/* État pour le checked du radio */}
    const [selectedResult, setSelectedResult] = useState<IResult | null>(null);
    const divResultsRef = useRef<HTMLDivElement>(null);
    const inputTextRef = useRef<HTMLInputElement>(null);    

    // Fonction de gestion de la saisie de recherche
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        const regex = new RegExp(event.target.value, 'gi');
        const arrResults: IResult[] = [];
        ApiResults.forEach(u => {
            if(u.nom.match(regex)) {
                console.log('>>>found ' + u.nom);
                arrResults.push(u);
            } else {
                console.log(u.nom + ' not found')
            }
        });

        setSearchResults(arrResults);
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' && searchResults.length > 0 && divResultsRef.current) {
          const firstRadio = divResultsRef.current.querySelector('input[type="radio"]') as HTMLInputElement;
          if (firstRadio) {
            firstRadio.focus();
            event.preventDefault(); // Pour éviter le défilement de la page par défaut
          }

          const labels = divResultsRef.current.querySelectorAll('label');
          if (labels) {
            labels.forEach((l) => l.classList.remove('selected'));
            labels[0].classList.add('selected')
          }
        }
    };

    const handleResultChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedId = event.target.id;
        const selectedResult = searchResults.find((r) => r.id === selectedId) || null;
        setSelectedResult(selectedResult);

        //TODO passer la classe selected
    };

    return (
        <div className="test-page">
            <h1>Welcome Test</h1>
            <br />
            <div className='search'>
                {/* Champ de texte pour la saisie de recherche */}
                <input
                    type="text"
                    placeholder="Entrez votre recherche"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    tabIndex={1}
                    ref={inputTextRef}
                />

                {/* Div pour afficher les résultats */}
                {searchTerm.length > 0 && 
                    <div className='results' ref={divResultsRef}>
                        <h2>Résultats :</h2>
                        {searchResults.length > 0 &&
                            searchResults.map((r, index) => (
                                <>
                                    <input
                                    type="radio"
                                    id={r.id}
                                    name="results-group"
                                    value={JSON.stringify(r)}
                                    checked={selectedResult?.id === r.id}
                                    onChange={handleResultChange}
                                    tabIndex={(index === 0) ? index + 2 :  index + 1}
                                    />
                                    <label htmlFor={r.id}><Link to={`user/${r.id}`}>{r.prenom} {r.nom} Age: {r.age} ans</Link></label>
                                </>
                            ))
                        }
                    </div>
                    ||
                    <h3>Aucun résultats trouvés</h3>
                }
            </div>
        </div>
    );
}
