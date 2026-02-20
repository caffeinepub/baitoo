import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetTimeSlots, useSetTimeSlots } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function TimeSlotManagementPage() {
  const { identity } = useInternetIdentity();
  const salonId = identity?.getPrincipal().toString();
  const { data: existingSlots } = useGetTimeSlots(salonId);
  const setTimeSlots = useSetTimeSlots();

  const [slots, setSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');

  useEffect(() => {
    if (existingSlots) {
      setSlots(existingSlots);
    }
  }, [existingSlots]);

  const handleAddSlot = () => {
    if (!newSlot.trim()) {
      toast.error('Please enter a time slot');
      return;
    }

    if (slots.includes(newSlot.trim())) {
      toast.error('This time slot already exists');
      return;
    }

    setSlots([...slots, newSlot.trim()]);
    setNewSlot('');
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (slots.length === 0) {
      toast.error('Please add at least one time slot');
      return;
    }

    try {
      await setTimeSlots.mutateAsync(slots);
      toast.success('Time slots saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save time slots');
    }
  };

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Time Slots</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Time Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g., 10:00 AM"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSlot()}
              />
            </div>
            <Button onClick={handleAddSlot}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Time Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No time slots added yet</p>
          ) : (
            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">{slot}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlot(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        className="w-full" 
        disabled={setTimeSlots.isPending || slots.length === 0}
      >
        {setTimeSlots.isPending ? 'Saving...' : 'Save Time Slots'}
      </Button>
    </div>
  );
}
