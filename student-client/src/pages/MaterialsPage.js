import React, { useState, useEffect } from 'react';
import { materialAPI, buildServerUrl } from '../services/api';

// Helper Icons
const getFileIcon = (type) => {
  const iconClass = "premium-resource-icon ";
  if (['pdf'].includes(type)) {
    return (
      <div className={iconClass + "icon-pdf"}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM1.6 11.85H0v3.999h.791v-1.342h.803c.287 0 .531-.057.732-.173.203-.117.358-.275.463-.474a1.42 1.42 0 0 0 .161-.677c0-.25-.053-.476-.158-.677a1.176 1.176 0 0 0-.46-.477c-.2-.12-.443-.179-.732-.179Zm.545 1.333a.795.795 0 0 1-.085.38.574.574 0 0 1-.238.241.794.794 0 0 1-.375.082H.788V12.48h.66c.218 0 .389.06.512.181.123.122.185.296.185.522Zm1.217-1.333v3.999h1.46c.401 0 .734-.08.998-.237a1.45 1.45 0 0 0 .595-.689c.13-.3.196-.662.196-1.084 0-.42-.065-.778-.196-1.075a1.426 1.426 0 0 0-.589-.68c-.264-.156-.599-.234-1.005-.234H3.362Zm.791.645h.563c.249 0 .45.05.603.151a.89.89 0 0 1 .354.454c.079.201.118.452.118.753a2.3 2.3 0 0 1-.068.592 1.14 1.14 0 0 1-.196.422.8.8 0 0 1-.334.252 1.298 1.298 0 0 1-.483.082h-.557v-2.706ZM7.46 11.85v2.66h-.845v-2.66h.845Zm-1.345 0v3.999h2.382v-.65H6.96v-1.05h1.106v-.654H6.96v-.99h1.27v-.655H6.115Z"/>
        </svg>
      </div>
    );
  }
  if (['mp4', 'webm', 'ogg'].includes(type)) {
    return (
      <div className={iconClass + "icon-vid"}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm6.79-6.907A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z"/>
        </svg>
      </div>
    );
  }
  if (['doc', 'docx'].includes(type)) {
    return (
      <div className={iconClass + "icon-doc"}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3zM3 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5H9a2 2 0 0 1-2-2V1H3v13z"/>
          <path d="M5 8h6v1H5zM5 10h6v1H5zM5 12h3v1H5z"/>
        </svg>
      </div>
    );
  }
  if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) {
    return (
      <div className={iconClass + "icon-img"}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
          <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2zM14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1zM2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1h-10z"/>
        </svg>
      </div>
    );
  }
  return (
    <div className={iconClass + "icon-gen"}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3zM3 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5H9a2 2 0 0 1-2-2V1H3v13z"/>
      </svg>
    </div>
  );
};

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [viewingMaterial, setViewingMaterial] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await materialAPI.getAllMaterials();
      setMaterials(res.data.materials || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const subjects = ['All', ...new Set(materials.map((material) => material.subject))].slice(0, 10);
  const filteredMaterials =
    selectedSubject === 'All'
      ? materials
      : materials.filter((material) => material.subject === selectedSubject);
  const viewingMaterialUrl = viewingMaterial ? buildServerUrl(viewingMaterial.fileUrl) : '';

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="page-content">
        <div className="dashboard-header mb-4">
          <span className="nav-unread" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '4px 12px' }}>Resources</span>
          <h1 className="dashboard-title">Digital Library</h1>
          <p className="dashboard-subtitle">
            Explore premium learning resources shared by staff to enhance your study sessions.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        )}

        <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: 'none',
                background: selectedSubject === subject ? 'var(--accent-primary)' : 'var(--bg-surface-solid)',
                color: selectedSubject === subject ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {subject}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span>Loading...</span>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="island-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>No study materials are available for {selectedSubject !== 'All' ? selectedSubject : 'now'}.</div>
          </div>
        ) : (
          <div className="floating-grid">
            {filteredMaterials.map((material) => (
              <div key={material._id} className="island-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {getFileIcon(material.fileType)}
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', alignSelf: 'flex-start' }}>{material.subject}</div>
                  <h3 className="island-title">{material.title}</h3>
                  <p className="island-desc" style={{ flex: 1 }}>{material.description || 'No description available.'}</p>
                  
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/></svg> 
                     {material.staffId?.name || 'Unknown Staff'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                     <span>{material.topic || 'General'}</span>
                     <span>{new Date(material.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={() => setViewingMaterial(material)}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
                    {material.fileType === 'link' ? 'Open Resource' : 'View Material'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingMaterial && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>{viewingMaterial.title}</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{viewingMaterial.subject}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a href={viewingMaterialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none', fontSize: '0.85rem' }}>
                 Open in New Tab
              </a>
              <button 
                onClick={() => setViewingMaterial(null)} 
                style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem' }}
              >&times;</button>
            </div>
          </div>
          <div style={{ flex: 1, padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
             {['jpg', 'jpeg', 'png', 'gif'].includes(viewingMaterial.fileType?.toLowerCase()) ? (
                <img src={viewingMaterialUrl} alt={viewingMaterial.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
             ) : ['mp4', 'webm', 'ogg'].includes(viewingMaterial.fileType?.toLowerCase()) ? (
                <video controls style={{ maxWidth: '100%', maxHeight: '100%', background: 'black', borderRadius: '12px' }}>
                  <source src={viewingMaterialUrl} type={`video/${viewingMaterial.fileType}`} />
                  Your browser does not support the video tag.
                </video>
             ) : (
                <iframe src={viewingMaterialUrl} title={viewingMaterial.title} style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: '12px' }} />
             )}
          </div>
        </div>
      )}
    </>
  );
};

export default MaterialsPage;
