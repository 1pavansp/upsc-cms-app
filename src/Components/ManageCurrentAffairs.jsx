
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const formatDate = (date) => {
    if (!date) return '';
    // Check if it's a Firestore Timestamp object
    if (typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
    }
    // Check if it's a valid Date object or a string that can be parsed into a Date
    try {
        const d = new Date(date);
        if (!isNaN(d.getTime())) { // Check if date is valid
            return d.toLocaleDateString();
        }
    } catch (e) {
        // Fallback if new Date(date) fails
    }
    return 'Invalid Date'; // Fallback for unparseable dates
};

const ManageCurrentAffairs = ({ setEditingArticle }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');

    const uniqueCategories = useMemo(() => {
        const categorySet = new Set();
        articles.forEach(article => {
            const normalizedCategory = (article.category || '').toString().trim();
            if (normalizedCategory) {
                categorySet.add(normalizedCategory);
            }
        });
        return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
    }, [articles]);

    const filteredArticles = useMemo(() => {
        if (categoryFilter === 'all') {
            return articles;
        }
        return articles.filter(article => (article.category || '').toString().trim() === categoryFilter);
    }, [articles, categoryFilter]);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'current-affairs'));
                const articlesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setArticles(articlesList);
            } catch (err) {
                setError('Failed to fetch articles.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    useEffect(() => {
        if (categoryFilter !== 'all' && !uniqueCategories.includes(categoryFilter)) {
            setCategoryFilter('all');
        }
    }, [categoryFilter, uniqueCategories]);

    const handleClickOpen = (article) => {
        setSelectedArticle(article);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedArticle(null);
    };

    const handleDelete = async () => {
        if (selectedArticle) {
            try {
                await deleteDoc(doc(db, 'current-affairs', selectedArticle.id));
                setArticles(prevArticles => prevArticles.filter(article => article.id !== selectedArticle.id));
                handleClose();
            } catch (err) {
                setError('Failed to delete article.');
                console.error(err);
            }
        }
    };

    const handleCategoryFilterChange = (event) => {
        setCategoryFilter(event.target.value);
    };

    if (loading) return <p>Loading articles...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="current-affairs-category-filter-label">Filter by Category</InputLabel>
                    <Select
                        labelId="current-affairs-category-filter-label"
                        value={categoryFilter}
                        label="Filter by Category"
                        onChange={handleCategoryFilterChange}
                    >
                        <MenuItem value="all">All Categories</MenuItem>
                        {uniqueCategories.map(category => (
                            <MenuItem key={category} value={category}>
                                {category}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredArticles.length > 0 ? (
                            filteredArticles.map((article) => (
                                <TableRow key={article.id}>
                                    <TableCell>{article.title}</TableCell>
                                    <TableCell>{article.category}</TableCell>
                                    <TableCell>{formatDate(article.date)}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => setEditingArticle(article)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleClickOpen(article)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    {categoryFilter === 'all'
                                        ? 'No current affairs articles found.'
                                        : `No articles found for "${categoryFilter}".`}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Delete Article</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the article "{selectedArticle?.title}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default ManageCurrentAffairs;
