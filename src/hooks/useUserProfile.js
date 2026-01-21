import { useState, useEffect } from 'react';
import { documentService } from '../api/services/documentService';
import { lessonService } from '../api/services/lessonService';


export const useUserProfile = (userId) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  
  const fetchDocuments = async () => {
    if (!userId) return;
    
    setLoadingDocs(true);
    try {
      const response = await documentService.getUserDocuments(userId);
      if (response.success) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  
  const fetchLessons = async () => {
    if (!userId) return;
    
    setLoadingLessons(true);
    try {
      const response = await lessonService.getUserLessons(userId, { per_page: 10 });
      if (response.success) {
        setLessons(response.data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  
  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return false;
    
    try {
      await documentService.deleteDocument(userId, documentId);
      fetchDocuments(); 
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  };

  
  useEffect(() => {
    if (userId) {
      fetchDocuments();
      fetchLessons();
    }
  }, [userId]);

  return {
    documents,
    loadingDocs,
    lessons,
    loadingLessons,
    fetchDocuments,
    fetchLessons,
    deleteDocument,
  };
};

