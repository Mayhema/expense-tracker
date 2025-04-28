import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [transactions, setTransactions] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('http://localhost:3001/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('http://localhost:3001/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setTransactions(response.data);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    return (
        <div>
            <h1>Expense Tracker</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            <h2>Transactions</h2>
            <ul>
                {transactions.map((transaction, index) => (
                    <li key={index}>
                        {transaction.date} - {transaction.description} - {transaction.amount}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
