const [showCreateModal, setShowCreateModal] = useState(false);
const [editingProgram, setEditingProgram] = useState<Program | null>(null);
const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'general' | 'eligibility' | 'evaluation' | 'ai'>('general');