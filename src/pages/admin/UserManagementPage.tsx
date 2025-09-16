import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUserManagementStore, User, UserRole } from '../../stores/userManagementStore';
import RoleManagementModal from '../../components/admin/RoleManagementModal';
import PartnerAssignmentModal from '../../components/admin/PartnerAssignmentModal';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Shield,
  Mail,
  Building,
  Calendar,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const userSchema = Yup.object().shape({
  name: Yup.string().required('Nom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  role: Yup.string().required('Rôle requis'),
  organization: Yup.string().when('role', {
    is: (val: string) => val === 'partner' || val === 'submitter',
    then: () => Yup.string().required('Organisation requise'),
    otherwise: () => Yup.string().optional(),
  }),
});

interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  isActive: boolean;
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { 
    users, 
    isLoading, 
    fetchUsers, 
    addUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus 
  } = useUserManagementStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showPartnerAssignment, setShowPartnerAssignment] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debug: Log users to see if they're being fetched
  console.log('Users in component:', users);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.organization && user.organization.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (values: UserFormValues, { resetForm, setSubmitting }: any) => {
    try {
      await addUser({
        name: values.name,
        email: values.email,
        role: values.role,
        organization: values.organization,
        isActive: values.isActive,
      });
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (values: UserFormValues, { setSubmitting }: any) => {
    if (!editingUser) return;
    
    try {
      await updateUser(editingUser.id, {
        name: values.name,
        email: values.email,
        role: values.role,
        organization: values.organization,
        isActive: values.isActive,
      });
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      admin: 'Administrateur',
      partner: 'Partenaire',
      manager: 'Gestionnaire',
      submitter: 'Soumissionnaire'
    };
    return labels[role];
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-error-100 text-error-800',
      partner: 'bg-primary-100 text-primary-800',
      manager: 'bg-secondary-100 text-secondary-800',
      submitter: 'bg-accent-100 text-accent-800'
    };
    return colors[role];
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h2>
        <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-1 text-gray-600">Gérez les utilisateurs et leurs privilèges</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            leftIcon={<Shield className="h-4 w-4" />}
            onClick={() => setShowRoleManagement(true)}
          >
            Gestion des rôles
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Users className="h-4 w-4" />}
            onClick={() => setShowPartnerAssignment(true)}
          >
            Attribution partenaires
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="partner">Partenaire</option>
                <option value="manager">Gestionnaire</option>
                <option value="submitter">Soumissionnaire</option>
              </select>
              
              <select
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Chargement des utilisateurs...</div>
            </div>
          )}
          
          {error && (
            <div className="bg-error-100 text-error-700 p-4 rounded-md mb-4">
              Erreur: {error}
            </div>
          )}
          
          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">Aucun utilisateur trouvé</div>
            </div>
          )}
          
          {!isLoading && !error && filteredUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organisation
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        {user.organization && (
                          <>
                            <Building className="h-3 w-3 mr-1 text-gray-400" />
                            {user.organization}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isActive 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Jamais'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                          leftIcon={user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        >
                          {user.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          leftIcon={<Edit className="h-3 w-3" />}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(user.id)}
                          leftIcon={<Trash2 className="h-3 w-3" />}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un nouvel utilisateur</h3>
              <Formik
                initialValues={{
                  name: '',
                  email: '',
                  role: 'submitter' as UserRole,
                  organization: '',
                  isActive: true,
                }}
                validationSchema={userSchema}
                onSubmit={handleCreateUser}
              >
                {({ values, isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <Field
                        name="name"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="name" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <Field
                        name="email"
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="email" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rôle</label>
                      <Field
                        as="select"
                        name="role"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="submitter">Soumissionnaire</option>
                        <option value="manager">Gestionnaire</option>
                        <option value="partner">Partenaire</option>
                        <option value="admin">Administrateur</option>
                      </Field>
                      <ErrorMessage name="role" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    {(values.role === 'partner' || values.role === 'submitter') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Organisation</label>
                        <Field
                          name="organization"
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <ErrorMessage name="organization" component="div" className="mt-1 text-sm text-error-600" />
                      </div>
                    )}

                    <div>
                      <label className="flex items-center">
                        <Field
                          name="isActive"
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Utilisateur actif</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateModal(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                      >
                        Créer
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier l'utilisateur</h3>
              <Formik
                initialValues={{
                  name: editingUser.name,
                  email: editingUser.email,
                  role: editingUser.role,
                  organization: editingUser.organization || '',
                  isActive: editingUser.isActive,
                }}
                validationSchema={userSchema}
                onSubmit={handleUpdateUser}
              >
                {({ values, isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <Field
                        name="name"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="name" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <Field
                        name="email"
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="email" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rôle</label>
                      <Field
                        as="select"
                        name="role"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="submitter">Soumissionnaire</option>
                        <option value="manager">Gestionnaire</option>
                        <option value="partner">Partenaire</option>
                        <option value="admin">Administrateur</option>
                      </Field>
                      <ErrorMessage name="role" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    {(values.role === 'partner' || values.role === 'submitter') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Organisation</label>
                        <Field
                          name="organization"
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <ErrorMessage name="organization" component="div" className="mt-1 text-sm text-error-600" />
                      </div>
                    )}

                    <div>
                      <label className="flex items-center">
                        <Field
                          name="isActive"
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Utilisateur actif</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingUser(null)}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                      >
                        Modifier
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
                <Trash2 className="h-6 w-6 text-error-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Supprimer l'utilisateur</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      <RoleManagementModal
        isOpen={showRoleManagement}
        onClose={() => setShowRoleManagement(false)}
      />
      
      {/* Partner Assignment Modal */}
      <PartnerAssignmentModal
        isOpen={showPartnerAssignment}
        onClose={() => setShowPartnerAssignment(false)}
      />
    </div>
  );
};

export default UserManagementPage;