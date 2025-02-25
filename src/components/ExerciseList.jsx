import React from 'react';

const ExerciseList = ({ esercizi, onDelete }) => {
    if (!esercizi?.length) {
        return (
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Nessun esercizio presente</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 transition-colors">
                <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Nome</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Gruppo Muscolare</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Attrezzatura</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">Azioni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {esercizi.map((esercizio) => (
                        <tr key={esercizio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{esercizio.nome}</div>
                                    {esercizio.descrizione && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{esercizio.descrizione}</div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {esercizio.gruppo_muscolare}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {esercizio.attrezzatura || '-'}
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => onDelete(esercizio.id)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-medium transition-colors"
                                >
                                    Elimina
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExerciseList;