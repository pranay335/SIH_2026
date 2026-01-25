import React, { useState, useEffect } from 'react';
import { userService } from '../../services/apiService';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Water',
    municipalityCode: 'BMC',
    employeeId: '',
    designation: 'Field Officer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Creating employee with data:', formData);
      const response = await userService.createEmployee(formData);
      console.log('Employee creation response:', response);
      setSuccess('Employee created successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        department: 'Water',
        municipalityCode: 'BMC',
        employeeId: '',
        designation: 'Field Officer'
      });
      setShowForm(false);
      fetchEmployees();
    } catch (error) {
      console.error('Employee creation error:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || `Failed to create employee: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'Add Employee'}
          </button>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {showForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Employee</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="Water">Water</option>
                  <option value="Roads">Roads</option>
                  <option value="Waste">Waste</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Health">Health</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Municipality</label>
                <select
                  name="municipalityCode"
                  value={formData.municipalityCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="BMC">BMC</option>
                  <option value="TMC">TMC</option>
                  <option value="KDMC">KDMC</option>
                  <option value="PMC">PMC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Employee List</h2>
            {employees.length === 0 ? (
              <p className="text-gray-400">No employees found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 px-2">Name</th>
                      <th className="pb-3 px-2">Email</th>
                      <th className="pb-3 px-2">Employee ID</th>
                      <th className="pb-3 px-2">Department</th>
                      <th className="pb-3 px-2">Designation</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2">Workload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee._id} className="border-b border-gray-700">
                        <td className="py-3 px-2">{employee.name}</td>
                        <td className="py-3 px-2">{employee.email}</td>
                        <td className="py-3 px-2">{employee.employeeId}</td>
                        <td className="py-3 px-2">{employee.department}</td>
                        <td className="py-3 px-2">{employee.designation}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            employee.availabilityStatus === 'AVAILABLE' 
                              ? 'bg-green-600' 
                              : 'bg-yellow-600'
                          }`}>
                            {employee.availabilityStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {employee.currentWorkload || 0}/{employee.maxConcurrentComplaints || 10}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
