import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, MapPin, Heart, Users, Zap, Eye } from "lucide-react";

const species = [
  { id: 1, name: "Northern Giraffe", subspecies: "Nubian", population: 2645, status: "Critically Endangered", height: "5.5m", weight: "1200kg", habitat: "East Africa", diet: "Acacia leaves", lifespan: "25 years", fact: "Has the highest blood pressure of any land mammal." },
  { id: 2, name: "Reticulated Giraffe", subspecies: "Reticulated", population: 15985, status: "Vulnerable", height: "5.8m", weight: "1250kg", habitat: "Horn of Africa", diet: "Commiphora leaves", lifespan: "28 years", fact: "Distinctive large polygonal patches separated by white lines." },
  { id: 3, name: "Masai Giraffe", subspecies: "Masai", population: 32550, status: "Endangered", height: "5.9m", weight: "1300kg", habitat: "Tanzania, Kenya", diet: "Mixed savanna foliage", lifespan: "26 years", fact: "Largest of all giraffe subspecies by height." },
  { id: 4, name: "Southern Giraffe", subspecies: "Angolan", population: 44144, status: "Least Concern", height: "5.2m", weight: "1150kg", habitat: "Southern Africa", diet: "Acacia & Terminalia", lifespan: "24 years", fact: "Most stable population thanks to conservation programs." },
  { id: 5, name: "West African Giraffe", subspecies: "Nigerian", population: 600, status: "Critically Endangered", height: "5.3m", weight: "1100kg", habitat: "Niger, Nigeria", diet: "Savanna browse", lifespan: "22 years", fact: "Rarest giraffe — fewer than 600 individuals remain." },
  { id: 6, name: "Kordofan Giraffe", subspecies: "Kordofan", population: 2000, status: "Critically Endangered", height: "5.4m", weight: "1180kg", habitat: "Central Africa", diet: "Woodland foliage", lifespan: "23 years", fact: "Spots extend down to lower legs unlike other subspecies." },
];

const habitats = [
  { region: "East Africa", countries: "Kenya, Tanzania, Uganda", coverage: "1.2M km²", giraffes: 38000, threats: "Poaching, Habitat loss", protectedAreas: 14 },
  { region: "Southern Africa", countries: "Botswana, Zimbabwe, Namibia", coverage: "980K km²", giraffes: 44000, threats: "Drought, Human conflict", protectedAreas: 21 },
  { region: "West Africa", countries: "Niger, Nigeria", coverage: "120K km²", giraffes: 600, threats: "Desertification, Poaching", protectedAreas: 3 },
  { region: "Central Africa", countries: "Chad, Cameroon, CAR", coverage: "340K km²", giraffes: 4500, threats: "Civil unrest, Logging", protectedAreas: 7 },
];

const healthRecords = [
  { id: "GRF-001", name: "Tall Sally", age: 7, location: "Nairobi Reserve", weight: "1180kg", lastCheckup: "2024-03-12", status: "Healthy", notes: "Excellent coat condition" },
  { id: "GRF-002", name: "Big Ben", age: 12, location: "Serengeti Zone B", weight: "1340kg", lastCheckup: "2024-02-28", status: "Monitoring", notes: "Mild leg joint inflammation" },
  { id: "GRF-003", name: "Spotty", age: 4, location: "Kruger North", weight: "980kg", lastCheckup: "2024-03-18", status: "Healthy", notes: "Growing well" },
  { id: "GRF-004", name: "Duchess", age: 9, location: "Etosha Pan", weight: "1100kg", lastCheckup: "2024-01-15", status: "Treatment", notes: "Skin lesion treatment ongoing" },
  { id: "GRF-005", name: "Stripes", age: 3, location: "Amboseli South", weight: "890kg", lastCheckup: "2024-03-20", status: "Healthy", notes: "Recently weaned" },
];

const statusColor: Record<string, string> = {
  "Critically Endangered": "destructive",
  "Endangered": "secondary",
  "Vulnerable": "outline",
  "Least Concern": "default",
  "Healthy": "default",
  "Monitoring": "secondary",
  "Treatment": "destructive",
};

export default function GiraffeExplorer() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof species[0] | null>(null);
  const [healthSearch, setHealthSearch] = useState("");

  const filteredSpecies = species.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.habitat.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHealth = healthRecords.filter(r =>
    r.name.toLowerCase().includes(healthSearch.toLowerCase()) ||
    r.location.toLowerCase().includes(healthSearch.toLowerCase())
  );

  const totalPop = species.reduce((a, s) => a + s.population, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">🦒 Giraffe Explorer</h1>
        <p className="text-muted-foreground mt-1">Comprehensive database of giraffe species, habitats, and health monitoring.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users size={16}/> Total Population</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totalPop.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">All tracked subspecies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Zap size={16}/> Subspecies</div>
            <div className="text-2xl font-bold text-foreground mt-1">{species.length}</div>
            <div className="text-xs text-muted-foreground">Recognised globally</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><MapPin size={16}/> Habitat Regions</div>
            <div className="text-2xl font-bold text-foreground mt-1">{habitats.length}</div>
            <div className="text-xs text-muted-foreground">Across Africa</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><Heart size={16}/> Health Records</div>
            <div className="text-2xl font-bold text-foreground mt-1">{healthRecords.length}</div>
            <div className="text-xs text-muted-foreground">Active individuals</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="species">
        <TabsList className="mb-4">
          <TabsTrigger value="species">Species</TabsTrigger>
          <TabsTrigger value="habitats">Habitats</TabsTrigger>
          <TabsTrigger value="health">Health Records</TabsTrigger>
          <TabsTrigger value="facts">Fun Facts</TabsTrigger>
        </TabsList>

        <TabsContent value="species">
          <Card>
            <CardHeader>
              <CardTitle>Giraffe Subspecies</CardTitle>
              <div className="relative mt-2">
                <Search size={14} className="absolute left-3 top-3 text-muted-foreground"/>
                <Input placeholder="Search by name or habitat..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {filteredSpecies.map(s => (
                  <div key={s.id} className="border border-border rounded-lg p-4 bg-card hover:bg-accent/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.habitat}</div>
                      </div>
                      <Badge variant={statusColor[s.status] as any ?? "outline"} className="text-xs">{s.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div><span className="font-medium text-foreground">Pop:</span> {s.population.toLocaleString()}</div>
                      <div><span className="font-medium text-foreground">Height:</span> {s.height}</div>
                      <div><span className="font-medium text-foreground">Weight:</span> {s.weight}</div>
                    </div>
                    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setSelected(s)}>
                      <Eye size={13} className="mr-1"/> View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habitats">
          <Card>
            <CardHeader><CardTitle>Habitat Regions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {habitats.map((h, i) => (
                <div key={i} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-foreground flex items-center gap-2"><MapPin size={14} className="text-primary"/>{h.region}</div>
                    <Badge variant="outline">{h.giraffes.toLocaleString()} giraffes</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground">Countries:</span><br/>{h.countries}</div>
                    <div><span className="font-medium text-foreground">Coverage:</span><br/>{h.coverage}</div>
                    <div><span className="font-medium text-foreground">Threats:</span><br/>{h.threats}</div>
                    <div><span className="font-medium text-foreground">Protected Areas:</span><br/>{h.protectedAreas}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Individual Health Records</CardTitle>
              <div className="relative mt-2">
                <Search size={14} className="absolute left-3 top-3 text-muted-foreground"/>
                <Input placeholder="Search by name or location..." className="pl-8" value={healthSearch} onChange={e => setHealthSearch(e.target.value)}/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-4">ID</th>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Age</th>
                      <th className="pb-2 pr-4">Location</th>
                      <th className="pb-2 pr-4">Weight</th>
                      <th className="pb-2 pr-4">Last Checkup</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHealth.map(r => (
                      <tr key={r.id} className="border-b border-border hover:bg-accent/20">
                        <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">{r.id}</td>
                        <td className="py-2 pr-4 font-medium text-foreground">{r.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.age}y</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.location}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.weight}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.lastCheckup}</td>
                        <td className="py-2 pr-4"><Badge variant={statusColor[r.status] as any ?? "outline"} className="text-xs">{r.status}</Badge></td>
                        <td className="py-2 text-muted-foreground text-xs">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facts">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { emoji: "🫀", title: "Blood Pressure", body: "A giraffe's heart weighs up to 11kg and generates double the blood pressure of humans to pump blood up its 1.8m neck." },
              { emoji: "😴", title: "Sleep", body: "Giraffes sleep only 30 minutes per day in short bursts of 5 minutes — one of the least sleeping mammals on Earth." },
              { emoji: "👅", title: "Tongue", body: "Their blue-black tongues reach up to 45cm long and are thick enough to grab thorny acacia branches without injury." },
              { emoji: "🏃", title: "Speed", body: "Giraffes can gallop at 55 km/h over short distances, making them faster than most predators in short sprints." },
              { emoji: "🤫", title: "Silent Giants", body: "Once thought mute, giraffes communicate through infrasound — low frequency hums inaudible to human ears." },
              { emoji: "🦟", title: "Tail Fly Swatter", body: "A giraffe's tail can be up to 1 metre long and is used as an effective whip to swat insects away." },
            ].map((f, i) => (
              <Card key={i}>
                <CardContent className="pt-5">
                  <div className="text-2xl mb-2">{f.emoji}</div>
                  <div className="font-semibold text-foreground mb-1">{f.title}</div>
                  <div className="text-sm text-muted-foreground">{f.body}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🦒 {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subspecies</span><span className="font-medium text-foreground">{selected.subspecies}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Conservation Status</span><Badge variant={statusColor[selected.status] as any ?? "outline"}>{selected.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Population</span><span className="font-medium text-foreground">{selected.population.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Height</span><span className="font-medium text-foreground">{selected.height}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span className="font-medium text-foreground">{selected.weight}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Habitat</span><span className="font-medium text-foreground">{selected.habitat}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Diet</span><span className="font-medium text-foreground">{selected.diet}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lifespan</span><span className="font-medium text-foreground">{selected.lifespan}</span></div>
              <div className="mt-3 p-3 bg-accent/30 rounded-md text-muted-foreground italic">💡 {selected.fact}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
