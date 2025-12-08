import React, { useState, useMemo, useCallback } from 'react';
import { WorldState, Scene, Location as LocationType, NPC, Thread, AdventureFeature } from '../types';
import { SceneIcon, LocationIcon, UserIcon, ThreadIcon, FeatureIcon, ResetIcon, DownloadIcon } from './Icons';

type ActiveView = { type: 'scene'; id: string } | { type: 'location'; id: string } | { type: 'npc'; id: string } | { type: 'thread'; id: string } | { type: 'feature'; id: string } | null;

const DetailCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold text-red-400 border-b border-red-900/50 pb-2 mb-2">{title}</h4>
        <div className="prose prose-sm prose-invert max-w-none text-gray-300">{children}</div>
    </div>
);

const WorldStateDisplay: React.FC<{ worldState: WorldState, onReset: () => void }> = ({ worldState, onReset }) => {
    const [activeView, setActiveView] = useState<ActiveView>({ type: 'scene', id: worldState.scenes[0]?.id });
    const [expandedLists, setExpandedLists] = useState({ scenes: true, locations: true, npcs: true, threads: true, features: true });

    const { scenesById, locationsById, npcsById, threadsById, adventureFeaturesById } = useMemo(() => {
        return {
            scenesById: new Map(worldState.scenes.map(s => [s.id, s])),
            locationsById: new Map(worldState.locations.map(l => [l.id, l])),
            npcsById: new Map(worldState.npcs.map(n => [n.id, n])),
            threadsById: new Map(worldState.threads.map(t => [t.id, t])),
            adventureFeaturesById: new Map(worldState.adventureFeatures.map(af => [af.id, af])),
        };
    }, [worldState]);

    const handleDownload = useCallback(() => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(worldState, null, 2)
        )}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = 'world-state.json';
        link.click();
    }, [worldState]);

    const renderActiveView = () => {
        if (!activeView) return <div className="flex h-full items-center justify-center text-gray-500">Select an item to view its details.</div>;
        
        switch (activeView.type) {
            case 'scene':
                const scene = scenesById.get(activeView.id);
                if (!scene) return <div>Scene not found.</div>;
                return <SceneDetails scene={scene} setActiveView={setActiveView} npcsById={npcsById} threadsById={threadsById} />;
            case 'location':
                const location = locationsById.get(activeView.id);
                if (!location) return <div>Location not found.</div>;
                return <LocationDetails location={location} setActiveView={setActiveView} />;
            case 'npc':
                const npc = npcsById.get(activeView.id);
                if (!npc) return <div>NPC not found.</div>;
                return <NpcDetails npc={npc} />;
            case 'thread':
                const thread = threadsById.get(activeView.id);
                if(!thread) return <div>Thread not found.</div>;
                return <ThreadDetails thread={thread} setActiveView={setActiveView} />;
             case 'feature':
                const feature = adventureFeaturesById.get(activeView.id);
                if(!feature) return <div>Adventure Feature not found.</div>;
                return <AdventureFeatureDetails feature={feature} />;
            default:
                return null;
        }
    };

    const toggleList = (list: keyof typeof expandedLists) => {
        setExpandedLists(prev => ({...prev, [list]: !prev[list]}));
    }

    type ViewType = 'scene' | 'location' | 'npc' | 'thread' | 'feature';

    const NavList = ({ title, items, icon, listKey, viewType }: { title: string, items: {id: string, name?: string, title?: string, goal?: string, feature?: string}[], icon: React.ReactNode, listKey: keyof typeof expandedLists, viewType: ViewType }) => (
        <div>
            <h3 onClick={() => toggleList(listKey)} className="flex items-center justify-between text-xl font-bold text-red-400 p-2 cursor-pointer hover:bg-red-900/20 rounded-md">
                <span>{title}</span>
                <span className={`transform transition-transform ${expandedLists[listKey] ? 'rotate-180' : ''}`}>▼</span>
            </h3>
            {expandedLists[listKey] && (
                 <ul className="space-y-1 mt-2">
                    {items.map(item => (
                        <li key={item.id} onClick={() => setActiveView({ type: viewType, id: item.id })}
                            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors duration-200 ${activeView?.id === item.id ? 'bg-red-800 text-white' : 'hover:bg-gray-700'}`}>
                            {icon}
                            <span>{item.title || item.name || item.goal || item.feature}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-900 text-gray-300">
            <aside className="w-1/3 max-w-sm h-full flex flex-col bg-gray-800 border-r border-gray-700">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl">World State</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleDownload} title="Download World State" className="p-2 rounded-md hover:bg-red-800 transition-colors">
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                        <button onClick={onReset} title="Generate New World State" className="p-2 rounded-md hover:bg-red-800 transition-colors">
                            <ResetIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                    <NavList title="Scenes" items={worldState.scenes} icon={<SceneIcon className="w-4 h-4" />} listKey="scenes" viewType="scene" />
                    <NavList title="Locations" items={worldState.locations} icon={<LocationIcon className="w-4 h-4" />} listKey="locations" viewType="location" />
                    <NavList title="NPCs" items={worldState.npcs} icon={<UserIcon className="w-4 h-4" />} listKey="npcs" viewType="npc" />
                    <NavList title="Threads" items={worldState.threads} icon={<ThreadIcon className="w-4 h-4" />} listKey="threads" viewType="thread" />
                    <NavList title="Adventure Features" items={worldState.adventureFeatures} icon={<FeatureIcon className="w-4 h-4" />} listKey="features" viewType="feature" />
                </nav>
            </aside>
            <main className="w-2/3 flex-1 h-full overflow-y-auto p-6">
                {renderActiveView()}
            </main>
        </div>
    );
};

const SceneDetails: React.FC<{ scene: Scene, setActiveView: (view: ActiveView) => void, npcsById: Map<string, NPC>, threadsById: Map<string, Thread> }> = ({ scene, setActiveView, npcsById, threadsById }) => {
    const branchingMap = useMemo(() => new Map(scene.branching.map(b => [b.milestone, b.nextSceneId])), [scene.branching]);

    return (
        <div>
            <h2 className="text-3xl font-bold text-red-400 mb-4">{scene.id}: {scene.title}</h2>
            <DetailCard title="Setup">{scene.setup}</DetailCard>
            <DetailCard title="Obstacles">
                <ul className="list-disc list-inside">{scene.obstacles.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </DetailCard>
            <DetailCard title="Mechanics & Tests">
                <ul className="list-disc list-inside">{scene.mechanics.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </DetailCard>
            <DetailCard title="Milestones & Exits">
                <ul className="list-disc list-inside">{scene.milestones.map((milestone, i) => {
                    const nextSceneId = branchingMap.get(milestone);
                    return (
                        <li key={i}>
                            {milestone}{' '}
                            {nextSceneId && (
                                <span
                                    className="text-red-400 cursor-pointer hover:underline"
                                    onClick={() => setActiveView({type: 'scene', id: nextSceneId})}
                                >
                                    -&gt; {nextSceneId}
                                </span>
                            )}
                        </li>
                    );
                })}</ul>
            </DetailCard>
            {scene.encounters && scene.encounters.length > 0 && (
                <DetailCard title="Encounters">
                    {scene.encounters.map((encounter, index) => (
                        <div key={index} className={index > 0 ? "mt-4 pt-4 border-t border-red-900/50" : ""}>
                            <h5 className="font-bold text-gray-100">{encounter.name}</h5>
                            <p><strong className="text-gray-400">Trigger:</strong> {encounter.trigger}</p>
                            <p className="mt-1">{encounter.description}</p>
                            {encounter.statBlockSuggestions && encounter.statBlockSuggestions.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-400">Suggested Enemies:</p>
                                    <ul className="list-disc list-inside text-sm">
                                        {encounter.statBlockSuggestions.map((stat, i) => <li key={i}>{stat}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </DetailCard>
            )}
            {scene.enemyProfile && <DetailCard title="Enemy Profile">{scene.enemyProfile}</DetailCard>}
            <DetailCard title="Associated NPCs">
                <ul className="list-disc list-inside">{scene.associatedNpcs.map((id, i) => {
                    const npc = npcsById.get(id);
                    return <li key={i} className="text-red-400 cursor-pointer hover:underline" onClick={() => setActiveView({ type: 'npc', id })}>{id}{npc ? `: ${npc.name}` : ''}</li>
                })}</ul>
            </DetailCard>
            <DetailCard title="Associated Threads">
                <ul className="list-disc list-inside">{scene.associatedThreads.map((id, i) => {
                     const thread = threadsById.get(id);
                    return <li key={i} className="text-red-400 cursor-pointer hover:underline" onClick={() => setActiveView({ type: 'thread', id })}>{id}{thread ? `: ${thread.goal}`: ''}</li>
                })}</ul>
            </DetailCard>
        </div>
    );
};

const LocationDetails: React.FC<{ location: LocationType, setActiveView: (view: ActiveView) => void }> = ({ location, setActiveView }) => (
     <div>
        <h2 className="text-3xl font-bold text-red-400 mb-4">{location.id}: {location.name}</h2>
        <DetailCard title="Description">{location.description}</DetailCard>
        <DetailCard title="Tone/Atmosphere">{location.tone}</DetailCard>
        <DetailCard title="Secrets">
            <ul className="list-disc list-inside">{location.secrets.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </DetailCard>
        <DetailCard title="Links">
            <ul className="list-disc list-inside">{location.links.map(link => (
                <li key={link.locationId}>
                    {link.description}{' '}
                    <span
                        className="text-red-400 cursor-pointer hover:underline"
                        onClick={() => setActiveView({type: 'location', id: link.locationId})}
                    >
                        -&gt; {link.locationId}
                    </span>
                </li>
            ))}</ul>
        </DetailCard>
        {location.sublocations && location.sublocations.length > 0 && <DetailCard title="Sublocations">
            {location.sublocations.map((sub, i) => (
                <div key={i} className="mt-2 pt-2 border-t border-gray-700/50">
                    <p><strong>{sub.name}:</strong> {sub.description}</p>
                    <p className="text-sm text-gray-400"><em>Significance:</em> {sub.significance}</p>
                </div>
            ))}
        </DetailCard>}
        <DetailCard title="Associated NPCs">
            <ul className="list-disc list-inside">{location.associatedNpcs.map((id, i) => <li key={i} className="text-red-400 cursor-pointer hover:underline" onClick={() => setActiveView({type: 'npc', id})}>{id}</li>)}</ul>
        </DetailCard>
    </div>
);

const NpcDetails: React.FC<{ npc: NPC }> = ({ npc }) => (
    <div>
        <h2 className="text-3xl font-bold text-red-400 mb-4">{npc.id}: {npc.name}</h2>
        <DetailCard title="Description">{npc.description}</DetailCard>
        <DetailCard title="Disposition">{npc.disposition}</DetailCard>
        <DetailCard title="Motivation">{npc.motivation}</DetailCard>
        <DetailCard title="Secrets">{npc.secrets}</DetailCard>
        {npc.statBlockSuggestion && <DetailCard title="Stat Block Suggestion">{npc.statBlockSuggestion}</DetailCard>}
    </div>
);

const ThreadDetails: React.FC<{ thread: Thread, setActiveView: (view: ActiveView) => void }> = ({ thread, setActiveView }) => (
    <div>
        <h2 className="text-3xl font-bold text-red-400 mb-4">{thread.id}: {thread.goal}</h2>
        <DetailCard title="Description">{thread.description}</DetailCard>
        {thread.location && (
            <DetailCard title="Associated Location">
                <p className="text-red-400 cursor-pointer hover:underline" onClick={() => setActiveView({ type: 'location', id: thread.location! })}>{thread.location}</p>
            </DetailCard>
        )}
        {thread.npcs && thread.npcs.length > 0 && (
            <DetailCard title="Associated NPCs">
                <ul className="list-disc list-inside">{thread.npcs.map((id, i) => <li key={i} className="text-red-400 cursor-pointer hover:underline" onClick={() => setActiveView({type: 'npc', id})}>{id}</li>)}</ul>
            </DetailCard>
        )}
    </div>
);

const AdventureFeatureDetails: React.FC<{ feature: AdventureFeature }> = ({ feature }) => (
    <div>
        <h2 className="text-3xl font-bold text-red-400 mb-4">{feature.id}: {feature.feature}</h2>
        <DetailCard title="Description">{feature.description}</DetailCard>
    </div>
);

export default WorldStateDisplay;