import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetSalonServices, useAddService, useUpdateService } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Service } from '../backend';

export default function ServiceManagementPage() {
  const { identity } = useInternetIdentity();
  const salonId = identity?.getPrincipal().toString();
  const { data: services, isLoading } = useGetSalonServices(salonId);

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Services</h1>
        <ServiceDialog />
      </div>

      {!services || services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No services added yet</p>
            <ServiceDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id.toString()}>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-primary font-semibold">₹{Number(service.price)}</p>
                  </div>
                  <ServiceDialog service={service} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceDialog({ service }: { service?: Service }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(service?.name || '');
  const [price, setPrice] = useState(service ? Number(service.price).toString() : '');
  const addService = useAddService();
  const updateService = useUpdateService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const priceValue = parseInt(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      if (service) {
        await updateService.mutateAsync({
          serviceId: service.id,
          name: name.trim(),
          price: BigInt(priceValue),
        });
        toast.success('Service updated successfully!');
      } else {
        await addService.mutateAsync({
          name: name.trim(),
          price: BigInt(priceValue),
        });
        toast.success('Service added successfully!');
      }
      setOpen(false);
      setName('');
      setPrice('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {service ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input
              id="serviceName"
              placeholder="e.g., Haircut"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g., 150"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="1"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={addService.isPending || updateService.isPending}
          >
            {addService.isPending || updateService.isPending ? 'Saving...' : service ? 'Update Service' : 'Add Service'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
