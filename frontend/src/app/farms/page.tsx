'use client';

import { useState, useEffect } from 'react';
import { farmAPI } from '../../lib/api';

interface Farm {
  _id: string;
  name: string;
  location: string;
  owner: string;
  businessType?: 'sole_proprietorship' | 'partnership' | 'corporation' | 'llc';
  numberOfPartners?: number;
  partnerDetails?: Array<{
    name: string;
    percentage: number;
  }>;
  contact: {
    phone: string;
    email?: string;
  };
  size?: number;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    username: string;
  };
  updatedBy: {
    username: string;
  };
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const [partnerInputs, setPartnerInputs] = useState<Array<{name: string, percentage: number}>>([]);
  const [businessType, setBusinessType] = useState<string>('sole_proprietorship'); // Track business type

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const data = activeOnly ? await farmAPI.getActive() : await farmAPI.getAll();
      setFarms(data);
    } catch (error) {
      console.error('Failed to fetch farms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [activeOnly]);

  useEffect(() => {
    // Handle initial display of partnership field based on business type
    if (showModal) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const businessTypeSelect = document.getElementById('farm-business-type') as HTMLSelectElement | null;
        const numberOfPartnersContainer = document.getElementById('farm-number-of-partners-container');
        
        if (businessTypeSelect && numberOfPartnersContainer) {
          numberOfPartnersContainer.style.display = businessTypeSelect.value === 'partnership' ? 'block' : 'none';
        }
        
        // Initialize partner inputs if editing a partnership
        if (editingFarm?.businessType === 'partnership' && editingFarm.partnerDetails) {
          setPartnerInputs(editingFarm.partnerDetails);
        } else {
          setPartnerInputs([]);
        }
      }, 0);
    } else {
      // Reset partner inputs when modal closes
      setPartnerInputs([]);
    }
  }, [showModal, editingFarm]);

  const handleAddFarm = () => {
    setEditingFarm(null);
    setShowModal(true);
  };

  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setShowModal(true);
  };

  const handleDeleteFarm = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this farm?')) {
      try {
        await farmAPI.delete(id);
        fetchFarms();
      } catch (error) {
        console.error('Failed to delete farm:', error);
        alert('Failed to delete farm. Please try again.');
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formEntries = Object.fromEntries(formData.entries());
    
    // Create a new object for API submission
    const data: Record<string, any> = {};
    
    // Handle nested contact object
    Object.keys(formEntries).forEach(key => {
      if (key.startsWith('contact.')) {
        // Handle nested contact fields
        const fieldName = key.split('.')[1];
        if (!data.contact) {
          data.contact = {};
        }
        data.contact[fieldName] = formEntries[key];
      } else {
        // Handle regular fields
        data[key] = formEntries[key];
      }
    });

    // Convert relevant fields to numbers
    const numericFields = ['size', 'capacity', 'numberOfPartners'];
    numericFields.forEach(field => {
      if (data[field]) {
        const value = parseFloat(data[field] as string);
        if (!isNaN(value)) {
          data[field] = value;
        } else {
          // Remove invalid numeric fields from data
          delete data[field];
        }
      }
    });

    // Convert isActive to boolean
    if ('isActive' in data) {
      data.isActive = data.isActive === 'true';
    }
    
    // Handle partnership details
    if (data.businessType === 'partnership' && data.numberOfPartners) {
      // Add partner details to data
      data.partnerDetails = partnerInputs;
      
      // Validate that percentages add up to 100
      const totalPercentage = partnerInputs.reduce((sum, partner) => sum + (partner.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`Total partner percentages must equal 100%. Current total: ${totalPercentage}%`);
        return;
      }
    } else {
      // Remove partnership fields if not applicable
      delete data.numberOfPartners;
      delete data.partnerDetails;
    }

    try {
      if (editingFarm) {
        await farmAPI.update(editingFarm._id, data);
      } else {
        await farmAPI.create(data);
      }
      setShowModal(false);
      fetchFarms();
    } catch (error) {
      console.error('Failed to save farm:', error);
      alert('Failed to save farm. Please check the form data and try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Farm Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Manage all farms, ownership types, and partnership details.
          </p>
        </div>
        <button
          onClick={handleAddFarm}
          className="btn btn-primary inline-flex items-center space-x-2 text-xs sm:text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Add Farm</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Show only active farms
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Farms Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Farms Overview</h2>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Farm Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Owner / Org.
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell"
                  >
                    Business Type
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell"
                  >
                    Partners
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell"
                  >
                    Size / Capacity
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell"
                  >
                    Contact
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {farms.map((farm) => (
                  <tr
                    key={farm._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {farm.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                      {farm.location}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {farm.owner}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      {farm.businessType === 'sole_proprietorship' && 'Sole'}
                      {farm.businessType === 'partnership' && 'Partnership'}
                      {farm.businessType === 'corporation' && 'Corp'}
                      {farm.businessType === 'llc' && 'LLC'}
                      {!farm.businessType && 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                      {farm.businessType === 'partnership' && farm.partnerDetails ? (
                        <div className="space-y-0.5">
                          {farm.partnerDetails.map((partner, index) => (
                            <div key={index} className="text-xs">
                              {partner.name}: {partner.percentage}%
                            </div>
                          ))}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                      {farm.size ? `${farm.size}ac` : 'N/A'}
                      {farm.capacity && ` / ${farm.capacity}b`}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hidden xl:table-cell">
                      {farm.contact.phone && <div>{farm.contact.phone}</div>}
                      {farm.contact.email && <div className="text-xs">{farm.contact.email}</div>}
                    </td>
                    <td className="px-3 sm:px-6 py-3">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          farm.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                        }`}
                      >
                        {farm.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm font-medium text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          onClick={() => handleEditFarm(farm)}
                          className="text-primary hover:text-primary-dark text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFarm(farm._id)}
                          className="text-danger hover:text-red-700 text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {farms.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No farms</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new farm.</p>
            <div className="mt-6">
              <button
                onClick={handleAddFarm}
                className="btn btn-primary inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Farm
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for adding/editing farms */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingFarm ? 'Edit Farm' : 'Add New Farm'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="mb-4">
                <label htmlFor="farm-name" className="form-label">
                  Farm Name *
                </label>
                <input
                  type="text"
                  id="farm-name"
                  name="name"
                  defaultValue={editingFarm?.name || ''}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="farm-business-type" className="form-label">
                  Business Type *
                </label>
                <select
                  id="farm-business-type"
                  name="businessType"
                  defaultValue={editingFarm?.businessType || 'sole_proprietorship'}
                  required
                  className="form-select"
                  onChange={(e) => {
                    const numberOfPartnersContainer = document.getElementById('farm-number-of-partners-container');
                    if (numberOfPartnersContainer) {
                      numberOfPartnersContainer.style.display = e.target.value === 'partnership' ? 'block' : 'none';
                    }
                    setBusinessType(e.target.value); // Update business type state
                  }}
                >
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="corporation">Corporation</option>
                  <option value="llc">LLC</option>
                </select>
              </div>
              
              {/* Owner/Organization Name Field */}
              <div className="mb-4">
                <label htmlFor="farm-owner" className="form-label">
                  {businessType === 'partnership' ? 'Organization Name *' : 'Owner Name *'}
                </label>
                <input
                  type="text"
                  id="farm-owner"
                  name="owner"
                  defaultValue={editingFarm?.owner || ''}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="mb-4" id="farm-number-of-partners-container" style={{ display: editingFarm?.businessType === 'partnership' ? 'block' : 'none' }}>
                <label htmlFor="farm-number-of-partners" className="form-label">
                  Number of Partners
                </label>
                <input
                  type="number"
                  id="farm-number-of-partners"
                  name="numberOfPartners"
                  defaultValue={editingFarm?.numberOfPartners || ''}
                  min="2"
                  className="form-input"
                  onChange={(e) => {
                    const numberOfPartners = parseInt(e.target.value) || 0;
                    // Initialize partner inputs array
                    const newPartnerInputs = [];
                    for (let i = 0; i < numberOfPartners; i++) {
                      newPartnerInputs.push({
                        name: editingFarm?.partnerDetails?.[i]?.name || '',
                        percentage: editingFarm?.partnerDetails?.[i]?.percentage || 0
                      });
                    }
                    setPartnerInputs(newPartnerInputs);
                  }}
                />
                
                {/* Partner Details Section */}
                {partnerInputs.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Partner Details</h3>
                    {partnerInputs.map((partner, index) => (
                      <div key={index} className="mb-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Partner {index + 1}</h4>
                        <div className="mb-2">
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={partner.name}
                            onChange={(e) => {
                              const newInputs = [...partnerInputs];
                              newInputs[index].name = e.target.value;
                              setPartnerInputs(newInputs);
                            }}
                            className="form-input text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Percentage (%)</label>
                          <input
                            type="number"
                            value={partner.percentage}
                            onChange={(e) => {
                              const newInputs = [...partnerInputs];
                              newInputs[index].percentage = parseFloat(e.target.value) || 0;
                              setPartnerInputs(newInputs);
                            }}
                            min="0"
                            max="100"
                            step="0.01"
                            className="form-input text-sm"
                            required
                          />
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Total: {partnerInputs.reduce((sum, partner) => sum + (partner.percentage || 0), 0).toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="farm-location" className="form-label">
                  Location *
                </label>
                <input
                  type="text"
                  id="farm-location"
                  name="location"
                  defaultValue={editingFarm?.location || ''}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="farm-phone" className="form-label">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="farm-phone"
                  name="contact.phone"
                  defaultValue={editingFarm?.contact?.phone || ''}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="farm-email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="farm-email"
                  name="contact.email"
                  defaultValue={editingFarm?.contact?.email || ''}
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="farm-size" className="form-label">
                  Size (acres)
                </label>
                <input
                  type="number"
                  id="farm-size"
                  name="size"
                  defaultValue={editingFarm?.size ?? undefined}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="farm-capacity" className="form-label">
                  Capacity (birds)
                </label>
                <input
                  type="number"
                  id="farm-capacity"
                  name="capacity"
                  defaultValue={editingFarm?.capacity ?? undefined}
                  min="0"
                  className="form-input"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="farm-status" className="form-label">
                  Status
                </label>
                <select
                  id="farm-status"
                  name="isActive"
                  defaultValue={editingFarm?.isActive ? 'true' : 'false'}
                  className="form-select"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingFarm ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}