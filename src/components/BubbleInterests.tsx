import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InterestHierarchy {
  id: string;
  parent_id?: string;
  name: string;
  category: string;
  level: number;
  icon?: string;
  description?: string;
  is_custom: boolean;
  children?: InterestHierarchy[];
}

interface BubbleInterestsProps {
  selectedInterests: string[];
  onInterestToggle: (interestId: string) => void;
  onCustomInterest: (name: string, parentId?: string) => Promise<void>;
}

export const BubbleInterests = ({ selectedInterests, onInterestToggle, onCustomInterest }: BubbleInterestsProps) => {
  const [currentLevel, setCurrentLevel] = useState<InterestHierarchy[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<InterestHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInterestName, setCustomInterestName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTopLevelInterests();
  }, []);

  const loadTopLevelInterests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interests_hierarchy')
        .select('*')
        .eq('level', 0)
        .order('name');

      if (error) throw error;
      setCurrentLevel(data || []);
      setBreadcrumb([]);
    } catch (error) {
      console.error('Error loading interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (parent: InterestHierarchy) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interests_hierarchy')
        .select('*')
        .eq('parent_id', parent.id)
        .order('name');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentLevel(data);
        setBreadcrumb([...breadcrumb, parent]);
      } else {
        // No children, treat as selectable interest
        onInterestToggle(parent.id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    if (breadcrumb.length === 0) return;

    const newBreadcrumb = breadcrumb.slice(0, -1);
    setBreadcrumb(newBreadcrumb);

    if (newBreadcrumb.length === 0) {
      loadTopLevelInterests();
    } else {
      loadChildren(newBreadcrumb[newBreadcrumb.length - 1]);
    }
  };

  const handleCustomInterest = async () => {
    if (!customInterestName.trim()) return;

    const parentId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;
    await onCustomInterest(customInterestName, parentId);
    setCustomInterestName('');
    setShowCustomInput(false);
    
    // Reload current level to show new custom interest
    if (breadcrumb.length === 0) {
      loadTopLevelInterests();
    } else {
      loadChildren(breadcrumb[breadcrumb.length - 1]);
    }
  };

  const filteredInterests = currentLevel.filter(interest =>
    interest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBubbleSize = (index: number) => {
    // Varied bubble sizes for visual interest
    const sizes = ['w-24 h-24', 'w-28 h-28', 'w-20 h-20', 'w-32 h-32'];
    return sizes[index % sizes.length];
  };

  const getBubblePosition = (index: number) => {
    // Pseudo-random positioning within constraints
    const positions = [
      'top-4 left-4',
      'top-8 right-8',
      'bottom-12 left-12',
      'bottom-4 right-4',
      'top-16 left-1/3',
      'bottom-8 left-2/3',
    ];
    return positions[index % positions.length];
  };

  return (
    <div className="min-h-[400px] relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {breadcrumb.length > 0 && (
            <Button
              variant="glass-outline"
              size="sm"
              onClick={navigateBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h3 className="text-foreground font-semibold">
              {breadcrumb.length > 0 
                ? breadcrumb[breadcrumb.length - 1].name 
                : 'Choose Your Interests'
              }
            </h3>
            <p className="text-muted-foreground text-sm">
              {breadcrumb.length > 0 
                ? 'Tap bubbles to explore or select'
                : 'Tap bubbles to explore subcategories'
              }
            </p>
          </div>
        </div>

            <Button
              variant="glass-outline"
              size="sm"
              onClick={() => setShowCustomInput(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom
            </Button>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <span>Interests</span>
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.id}>
              <span className="mx-2">→</span>
              <button
                onClick={() => {
                  const newBreadcrumb = breadcrumb.slice(0, index + 1);
                  setBreadcrumb(newBreadcrumb);
                  if (newBreadcrumb.length === 1) {
                    loadChildren(newBreadcrumb[0]);
                  }
                }}
                className="hover:text-foreground"
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search interests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-panel pl-10"
        />
      </div>

      {/* Custom Interest Input */}
      {showCustomInput && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-lg p-4 mb-6"
        >
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom interest..."
              value={customInterestName}
              onChange={(e) => setCustomInterestName(e.target.value)}
              className="glass-panel"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomInterest()}
            />
            <Button
              onClick={handleCustomInterest}
              disabled={!customInterestName.trim()}
            >
              Add
            </Button>
            <Button
              variant="glass-outline"
              onClick={() => {
                setShowCustomInput(false);
                setCustomInterestName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Bubble Container */}
      <div className="relative min-h-[300px] glass-panel rounded-2xl p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <motion.div
              key={`level-${breadcrumb.length}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="relative w-full h-full"
            >
              {/* Bubble Layout */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                {filteredInterests.map((interest, index) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  
                  return (
                    <motion.div
                      key={interest.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadChildren(interest)}
                        className={`
                          relative w-24 h-24 rounded-full flex flex-col items-center justify-center
                          transition-all duration-300 border-2 cursor-pointer
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground border-primary shadow-glow' 
                            : 'glass-panel hover:bg-primary/10 hover:border-primary/20'
                          }
                        `}
                      >
                        <span className="text-2xl mb-1">{interest.icon}</span>
                        <span className="text-xs font-medium text-center px-2 leading-tight">
                          {interest.name}
                        </span>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                        
                        {/* Custom interest indicator */}
                        {interest.is_custom && (
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full" />
                        )}
                      </motion.button>
                      
                      {/* Tooltip on hover */}
                        {interest.description && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            {interest.description}
                          </div>
                        )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Select at this level button */}
              {breadcrumb.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                >
                  <Button
                    onClick={() => onInterestToggle(breadcrumb[breadcrumb.length - 1].id)}
                    variant="glass-outline"
                  >
                    Select "{breadcrumb[breadcrumb.length - 1].name}"
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};