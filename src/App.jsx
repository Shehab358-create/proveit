import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

function createEndTime(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function formatCountdown(endTime) {
  if (!endTime) return "24h";

  const difference = new Date(endTime).getTime() - Date.now();

  if (difference <= 0) return "Beendet";

  const totalMinutes = Math.floor(difference / 1000 / 60);
  const days = Math.floor(totalMinutes / 60 / 24);
  const hours = Math.floor((totalMinutes / 60) % 24);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function isMissionEnded(endTime) {
  if (!endTime) return false;
  return new Date(endTime).getTime() <= Date.now();
}

function getMissionWinner(missionId, proofs) {
  const missionProofs = proofs
    .filter((proof) => proof.missionId === missionId)
    .sort((a, b) => b.votes - a.votes);

  return missionProofs[0] || null;
}

const startMissions = [
  {
    id: 1,
    title: "Make Someone Smile",
    category: "Social",
    description:
      "Mach heute etwas, das eine echte Person zum Lächeln bringt. Poste deinen Proof und sammle Votes.",
    reward:
      "Platz 1 bekommt 24h Spotlight + darf die nächste Mission vorschlagen.",
    endTime: createEndTime(6),
    participants: 18420,
  },
  {
    id: 2,
    title: "Create From Nothing",
    category: "Creator",
    description:
      "Baue, zeichne, filme oder schreibe in 30 Minuten etwas Kreatives aus dem Nichts.",
    reward: "Top 3 kommen in den Winners Room.",
    endTime: createEndTime(11),
    participants: 9240,
  },
  {
    id: 3,
    title: "City Beauty Battle",
    category: "City",
    description:
      "Zeig den schönsten oder unterschätztesten Ort in deiner Stadt.",
    reward: "Gewinnerstadt bekommt den City Champion Banner.",
    endTime: createEndTime(26),
    participants: 32180,
  },
];

const startProofs = [
  {
    id: 1,
    user: "Lina",
    handle: "@lina.moves",
    missionId: 1,
    caption:
      "Ich habe der Kassiererin einen Kaffee gebracht, weil sie meinte, ihr Tag sei stressig.",
    votes: 1284,
    city: "Berlin",
    badge: "Kindness Streak 7",
  },
  {
    id: 2,
    user: "Karim",
    handle: "@karimcreates",
    missionId: 2,
    caption: "30 Minuten, ein Karton, eine Lampe — daraus wurde ein Mini-Filmset.",
    votes: 1140,
    city: "Hamburg",
    badge: "Creator Rookie",
  },
  {
    id: 3,
    user: "Maya",
    handle: "@maya.real",
    missionId: 1,
    caption:
      "Ich habe 5 fremden Menschen ehrliche Komplimente gemacht. Am Ende war ich nervöser als sie.",
    votes: 980,
    city: "Köln",
    badge: "Fearless Moment",
  },
  {
    id: 4,
    user: "Noah",
    handle: "@noah.city",
    missionId: 3,
    caption: "Dieser kleine Innenhof in Berlin sieht nachts aus wie ein Filmset.",
    votes: 870,
    city: "Berlin",
    badge: "City Scout",
  },
];

function App() {
    function loadFromStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  }

  const [user, setUser] = useState(null);
const [authMode, setAuthMode] = useState("login");
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authName, setAuthName] = useState("");
const [authHandle, setAuthHandle] = useState("");
const [authError, setAuthError] = useState("");
const [authLoading, setAuthLoading] = useState(false);

 useEffect(() => {
  async function loadComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load comments error:", error);
      return;
    }

    const formattedComments = data.map((comment) => ({
      id: comment.id,
      proofId: comment.proof_id,
      userId: comment.user_id,
      user: comment.user_name,
      handle: comment.user_handle,
      text: comment.text,
      createdAt: comment.created_at,
    }));

    setComments(formattedComments);
  }

  loadComments();
}, []);

const [profile, setProfile] = useState(null);
const [profileBio, setProfileBio] = useState("");
const [profileCity, setProfileCity] = useState("");
const [isSavingProfile, setIsSavingProfile] = useState(false);

const [playerName, setPlayerName] = useState(() =>
  loadFromStorage("proveit_playerName", "")
);

const [playerHandle, setPlayerHandle] = useState(() =>
  loadFromStorage("proveit_playerHandle", "")
);

  const [tab, setTab] = useState("home");

  const [missions, setMissions] = useState(startMissions);
  const [isLoadingMissions, setIsLoadingMissions] = useState(false);
  const [supabaseError, setSupabaseError] = useState("");

  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [newMissionCategory, setNewMissionCategory] = useState("");
  const [newMissionDescription, setNewMissionDescription] = useState("");
  const [newMissionReward, setNewMissionReward] = useState("");
  const [newMissionEndsIn, setNewMissionEndsIn] = useState("");

  const [activeMissionId, setActiveMissionId] = useState(() =>
    loadFromStorage("proveit_activeMissionId", 1)
  );

  const [proofs, setProofs] = useState(startProofs);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [votedProofIds, setVotedProofIds] = useState([]);

  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState("");
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const [now, setNow] = useState(Date.now());

  const activeMission =
  missions.find((m) => m.id === activeMissionId) || missions[0];

  
  const activeMissionEnded = isMissionEnded(activeMission?.endTime);
  const activeMissionWinner = activeMission
    ? getMissionWinner(activeMission.id, proofs)
    : null;

  const missionProofs = useMemo(() => {
  if (!activeMission) return [];

  return proofs
    .filter((p) => p.missionId === activeMission.id)
    .sort((a, b) => b.votes - a.votes);
  }, [proofs, activeMission]);

  const leaderboard = useMemo(() => {
    return [...proofs].sort((a, b) => b.votes - a.votes);
  }, [proofs]);

  const winner = leaderboard[0];

  useEffect(() => {
    localStorage.setItem("proveit_playerName", JSON.stringify(playerName));
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem("proveit_playerHandle", JSON.stringify(playerHandle));
  }, [playerHandle]);

  useEffect(() => {
  async function loadSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      const currentUser = data.session.user;
      setUser(currentUser);
      loadProfile(currentUser.id);
    }
  }

  async function loadProfile(userId) {
  if (!userId) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Load profile error:", error);
    return;
  }

  if (!data) {
    const fallbackName =
      authName ||
      authEmail?.split("@")[0] ||
      user?.email?.split("@")[0] ||
      "Player";

    const fallbackHandle =
      authHandle ||
      "@" + fallbackName.toLowerCase().replaceAll(" ", "");

    const newProfile = {
      id: userId,
      name: fallbackName,
      handle: fallbackHandle.startsWith("@")
        ? fallbackHandle
        : "@" + fallbackHandle,
      bio: "",
      city: "Berlin",
    };

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert([newProfile])
      .select()
      .single();

    if (createError) {
      console.error("Auto create profile error:", createError);
      return;
    }

    setProfile(createdProfile);
    setPlayerName(createdProfile.name);
    setPlayerHandle(createdProfile.handle);
    setProfileBio(createdProfile.bio || "");
    setProfileCity(createdProfile.city || "");
    return;
  }

  setProfile(data);
  setPlayerName(data.name);
  setPlayerHandle(data.handle);
  setProfileBio(data.bio || "");
  setProfileCity(data.city || "");
}

  loadSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const currentUser = session.user;
      setUser(currentUser);

      const name =
        currentUser.user_metadata?.name ||
        currentUser.email?.split("@")[0] ||
        "Player";

      const handle =
        currentUser.user_metadata?.handle ||
        "@" + name.toLowerCase().replaceAll(" ", "");

      setPlayerName(name);
      setPlayerHandle(handle);
    } else {
      setUser(null);
      setProfile(null);
      setProfileBio("");
      setProfileCity("");
    }
  });

  return () => subscription.unsubscribe();
}, []);

  useEffect(() => {
  async function loadMissionsFromSupabase() {
    setIsLoadingMissions(true);
    setSupabaseError("");

    const { data, error } = await supabase
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase missions error:", error);
      setSupabaseError("Missionen konnten nicht aus Supabase geladen werden.");
      setIsLoadingMissions(false);
      return;
    }

    const formattedMissions = data.map((mission) => ({
      id: mission.id,
      title: mission.title,
      category: mission.category,
      description: mission.description,
      reward: mission.reward,
      endTime: mission.end_time,
      participants: mission.participants || 0,
    }));

    setMissions(formattedMissions);

if (formattedMissions.length > 0) {
  setActiveMissionId(formattedMissions[0].id);
}

setIsLoadingMissions(false);
  }

  loadMissionsFromSupabase();
}, []);

useEffect(() => {
  async function loadProofsFromSupabase() {
    setIsLoadingProofs(true);

    const { data, error } = await supabase
      .from("proofs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase proofs error:", error);
      setSupabaseError("Proofs konnten nicht aus Supabase geladen werden.");
      setIsLoadingProofs(false);
      return;
    }

    const formattedProofs = data.map((proof) => ({
      id: proof.id,
      user: proof.user_name,
      handle: proof.user_handle,
      missionId: proof.mission_id,
      caption: proof.caption,
      mediaUrl: proof.media_url,
      mediaType: proof.media_type,
      city: proof.city || "Berlin",
      badge: proof.badge || "New Challenger",
      votes: proof.votes || 0,
    }));

    setProofs(formattedProofs);
    setIsLoadingProofs(false);
  }

  loadProofsFromSupabase();
}, []);

useEffect(() => {
  async function loadUserVotes() {
    if (!user) return;

    const { data, error } = await supabase
      .from("votes")
      .select("proof_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Load votes error:", error);
      return;
    }

    setVotedProofIds(data.map((vote) => vote.proof_id));
  }

  loadUserVotes();
}, [user]);

  useEffect(() => {
  const interval = setInterval(() => {
    setNow(Date.now());
  }, 30000);

  return () => clearInterval(interval);
}, []);

    async function signUp() {
  setAuthError("");
  setAuthLoading(true);

  if (!authEmail.trim() || !authPassword.trim() || !authName.trim()) {
    setAuthError("Bitte E-Mail, Passwort und Name ausfüllen.");
    setAuthLoading(false);
    return;
  }

  const cleanHandle =
    authHandle.trim() || "@" + authName.toLowerCase().replaceAll(" ", "");

  const { data, error } = await supabase.auth.signUp({
    email: authEmail,
    password: authPassword,
    options: {
      data: {
        name: authName,
        handle: cleanHandle.startsWith("@") ? cleanHandle : "@" + cleanHandle,
      },
    },
  });

  if (error) {
    setAuthError(error.message);
    setAuthLoading(false);
    return;
  }

  if (data.user) {
  const finalHandle = cleanHandle.startsWith("@")
    ? cleanHandle
    : "@" + cleanHandle;

  const newProfile = {
    id: data.user.id,
    name: authName,
    handle: finalHandle,
    bio: "",
    city: "Berlin",
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .insert([newProfile]);

  if (profileError) {
    console.error("Create profile error:", profileError);
    setAuthError("Account erstellt, aber Profil konnte nicht erstellt werden.");
    setAuthLoading(false);
    return;
  }

  setUser(data.user);
  setProfile(newProfile);
  setPlayerName(authName);
  setPlayerHandle(finalHandle);
  setProfileBio("");
  setProfileCity("Berlin");
}

  setAuthLoading(false);
}

async function signIn() {
  setAuthError("");
  setAuthLoading(true);

  if (!authEmail.trim() || !authPassword.trim()) {
    setAuthError("Bitte E-Mail und Passwort ausfüllen.");
    setAuthLoading(false);
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: authPassword,
  });

  if (error) {
    setAuthError(error.message);
    setAuthLoading(false);
    return;
  }

  if (data.user) {
  setUser(data.user);
  await loadProfile(data.user.id);
}

  setAuthLoading(false);
}

async function logout() {
  await supabase.auth.signOut();
  setUser(null);
  setPlayerName("");
  setPlayerHandle("");
  setTab("home");
}

if (!user) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-mark login-logo">⚡</div>
        <p className="eyebrow">Social Mission Platform</p>
        <h1>ProveIt</h1>
        <p className="login-subtitle">
          Nicht nur zuschauen. Tritt Missionen bei, poste deinen Proof,
          sammle Votes und gewinne Spotlight.
        </p>

        <div className="auth-switch">
          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => {
              setAuthMode("login");
              setAuthError("");
            }}
          >
            Login
          </button>

          <button
            className={authMode === "signup" ? "active" : ""}
            onClick={() => {
              setAuthMode("signup");
              setAuthError("");
            }}
          >
            Registrieren
          </button>
        </div>

        <div className="login-form">
          {authMode === "signup" && (
            <>
              <input
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Dein Name"
              />

              <input
                value={authHandle}
                onChange={(e) => setAuthHandle(e.target.value)}
                placeholder="@deinhandle"
              />
            </>
          )}

          <input
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="E-Mail"
            type="email"
          />

          <input
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="Passwort"
            type="password"
          />

          {authError && <div className="auth-error">{authError}</div>}

          <button
            className="main-btn"
            onClick={authMode === "login" ? signIn : signUp}
            disabled={authLoading}
          >
            {authLoading
              ? "Bitte warten..."
              : authMode === "login"
              ? "Einloggen"
              : "Account erstellen"}
          </button>
        </div>

        <p className="login-note">Echter Login über Supabase Auth.</p>
      </div>
    </div>
  );
}

async function saveProfile() {
  if (!user) return;

  setIsSavingProfile(true);

  const updatedProfile = {
    name: playerName || "Player",
    handle: playerHandle?.startsWith("@")
      ? playerHandle
      : "@" + playerHandle,
    bio: profileBio,
    city: profileCity || "Berlin",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updatedProfile)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Save profile error:", error);
    setSupabaseError("Profil konnte nicht gespeichert werden.");
    setIsSavingProfile(false);
    return;
  }

  setProfile(data);
  setPlayerName(data.name);
  setPlayerHandle(data.handle);
  setProfileBio(data.bio || "");
  setProfileCity(data.city || "");
  setIsSavingProfile(false);
}

  async function createMission() {
  if (!newMissionTitle.trim() || !newMissionDescription.trim()) return;

  const newMission = {
    title: newMissionTitle,
    category: newMissionCategory || "Community",
    description: newMissionDescription,
    reward:
      newMissionReward ||
      "Platz 1 bekommt Spotlight + darf die nächste Mission vorschlagen.",
    end_time: createEndTime(Number(newMissionEndsIn) || 24),
    participants: 0,
  };

  const { data, error } = await supabase
    .from("missions")
    .insert([newMission])
    .select()
    .single();

  if (error) {
    console.error("Create mission error:", error);
    setSupabaseError("Mission konnte nicht in Supabase gespeichert werden.");
    return;
  }

  const formattedMission = {
    id: data.id,
    title: data.title,
    category: data.category,
    description: data.description,
    reward: data.reward,
    endTime: data.end_time,
    participants: data.participants || 0,
  };

  setMissions([formattedMission, ...missions]);

  setNewMissionTitle("");
  setNewMissionCategory("");
  setNewMissionDescription("");
  setNewMissionReward("");
  setNewMissionEndsIn("");
  setTab("home");
}

  function openMission(id) {
  setActiveMissionId(id);
  setTab("mission");
}

  async function vote(id) {
  if (!user) {
    setSupabaseError("Bitte einloggen, um zu voten.");
    return;
  }

  if (votedProofIds.includes(id)) return;

  const proof = proofs.find((item) => item.id === id);
  if (!proof) return;

  if (proof.handle === playerHandle) {
  setSupabaseError("Du kannst nicht für deinen eigenen Proof voten.");
  return;
}

  const { error: voteError } = await supabase.from("votes").insert([
    {
      user_id: user.id,
      proof_id: id,
    },
  ]);

  if (voteError) {
    console.error("Create vote error:", voteError);

    if (voteError.code === "23505") {
      setVotedProofIds([...votedProofIds, id]);
      return;
    }

    setSupabaseError("Vote konnte nicht gespeichert werden.");
    return;
  }

  const newVoteCount = proof.votes + 1;

  const { error: proofError } = await supabase
    .from("proofs")
    .update({ votes: newVoteCount })
    .eq("id", id);

  if (proofError) {
    console.error("Vote count update error:", proofError);
    setSupabaseError("Vote-Zahl konnte nicht aktualisiert werden.");
    return;
  }

  setProofs((oldProofs) =>
    oldProofs.map((item) =>
      item.id === id ? { ...item, votes: newVoteCount } : item
    )
  );

  setVotedProofIds([...votedProofIds, id]);
}

  function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  setSelectedFile(file);
  setSelectedPreview(URL.createObjectURL(file));
}

async function uploadProofMedia(file) {
  if (!file) return { publicUrl: null, mediaType: null };

  const fileExt = file.name.split(".").pop();
  const safeFileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const filePath = `${user.id}/${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("proof-media")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("proof-media")
    .getPublicUrl(filePath);

  return {
    publicUrl: data.publicUrl,
    mediaType: file.type,
  };
}

function getProofComments(proofId) {
  return comments.filter((comment) => comment.proofId === proofId);
}

async function postComment(proofId) {
  if (!user) {
    setSupabaseError("Bitte einloggen, um zu kommentieren.");
    return;
  }

  const text = commentInputs[proofId]?.trim();

  if (!text) return;

  setIsPostingComment(true);

  const commentToInsert = {
    proof_id: proofId,
    user_id: user.id,
    user_name: playerName || "Player",
    user_handle: playerHandle || "@player",
    text,
  };

  const { data, error } = await supabase
    .from("comments")
    .insert([commentToInsert])
    .select()
    .single();

  if (error) {
    console.error("Create comment error:", error);
    setSupabaseError("Kommentar konnte nicht gespeichert werden.");
    setIsPostingComment(false);
    return;
  }

  const newComment = {
    id: data.id,
    proofId: data.proof_id,
    userId: data.user_id,
    user: data.user_name,
    handle: data.user_handle,
    text: data.text,
    createdAt: data.created_at,
  };

  setComments([...comments, newComment]);

  setCommentInputs({
    ...commentInputs,
    [proofId]: "",
  });

  setOpenComments({
    ...openComments,
    [proofId]: true,
  });

  setIsPostingComment(false);
}

async function deleteComment(commentId) {
  if (!user) return;

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete comment error:", error);
    setSupabaseError("Kommentar konnte nicht gelöscht werden.");
    return;
  }

  setComments(comments.filter((comment) => comment.id !== commentId));
}

  async function postProof() {
  if (!activeMission || activeMissionEnded) return;
  if (!caption.trim() && !selectedFile) return;

  setIsUploadingProof(true);
  setSupabaseError("");

  try {
    const uploadedMedia = await uploadProofMedia(selectedFile);

    const proofToInsert = {
      mission_id: activeMission.id,
      user_name: playerName || "Du",
      user_handle: playerHandle || "@newplayer",
      caption: caption || "Mein Proof für diese Mission.",
      media_url: uploadedMedia.publicUrl,
      media_type: uploadedMedia.mediaType,
      city: "Berlin",
      badge: "New Challenger",
      votes: 0,
    };

    const { data, error } = await supabase
      .from("proofs")
      .insert([proofToInsert])
      .select()
      .single();

    if (error) {
      console.error("Create proof error:", error);
      setSupabaseError("Proof konnte nicht in Supabase gespeichert werden.");
      setIsUploadingProof(false);
      return;
    }

    const newProof = {
      id: data.id,
      user: data.user_name,
      handle: data.user_handle,
      missionId: data.mission_id,
      caption: data.caption,
      mediaUrl: data.media_url,
      mediaType: data.media_type,
      city: data.city || "Berlin",
      badge: data.badge || "New Challenger",
      votes: data.votes || 0,
    };

    setProofs([newProof, ...proofs]);
    setCaption("");
    setSelectedFile(null);
    setSelectedPreview("");
    setTab("mission");
  } catch (error) {
    console.error("Proof upload failed:", error);
    setSupabaseError("Datei konnte nicht hochgeladen werden.");
  }

  setIsUploadingProof(false);
}

  return (
    <div className="app">
      <header className="header">
  <div className="brand">
    <div className="logo-mark">⚡</div>
    <div>
      <p className="eyebrow">Social Mission Platform MVP</p>
      <h1>ProveIt</h1>
      <p className="subtitle">Nicht nur zuschauen. Beweis es.</p>
    </div>
  </div>

        <nav className="top-nav">
          <button onClick={() => setTab("home")} className={tab === "home" ? "active" : ""}>
            Home
          </button>
          <button onClick={() => setTab("mission")} className={tab === "mission" ? "active" : ""}>
            Mission
          </button>
          <button onClick={() => setTab("leaderboard")} className={tab === "leaderboard" ? "active" : ""}>
            Ranking
          </button>
          <button onClick={() => setTab("profile")} className={tab === "profile" ? "active" : ""}>
            Profil
          </button>
          <button onClick={() => setTab("admin")} className={tab === "admin" ? "active" : ""}>
            Admin
          </button>
          <button onClick={logout}>
            Logout
          </button>
        </nav>
      </header>
      
    <nav className="mobile-nav">
  <button onClick={() => setTab("home")} className={tab === "home" ? "active" : ""}>
    🏠
  </button>

  <button onClick={() => setTab("mission")} className={tab === "mission" ? "active" : ""}>
    ⚡
  </button>

  <button onClick={() => setTab("leaderboard")} className={tab === "leaderboard" ? "active" : ""}>
    🏆
  </button>

  <button onClick={() => setTab("profile")} className={tab === "profile" ? "active" : ""}>
    👤
  </button>
</nav>

      {tab === "home" && (
        <>
        {isLoadingMissions && (
  <div className="card status-card">
    Missionen werden aus Supabase geladen...
  </div>
)}

{supabaseError && (
  <div className="card status-card error-card">
    {supabaseError}
  </div>
)}
          <section className="mission-grid">
            {missions.map((mission) => (
              <div className="card mission-card" key={mission.id}>
                <div className="card-top">
                  <span className="category-pill">{mission.category}</span>
                  <span>{isMissionEnded(mission.endTime)
                         ? "🏁 Beendet"
                         : `⏳ ${formatCountdown(mission.endTime)}`}</span>
                </div>

                <h2>{mission.title}</h2>
                <p>{mission.description}</p>

                <div className="stats">
                  <div>
                    <strong>{mission.participants.toLocaleString("de-DE")}</strong>
                    <small>Teilnehmer</small>
                  </div>
                  <div>
                    <strong>Global</strong>
                    <small>Ort</small>
                  </div>
                </div>

                <div className="reward">👑 {mission.reward}</div>

                <button className="main-btn" onClick={() => openMission(mission.id)}>
                  Join Mission
                </button>
              </div>
            ))}
          </section>

          <section className="two-columns">
  <div className="card spotlight">
    <h2>🏆 Winner of the Day</h2>

    {winner ? (
      <>
        <h3>{winner.user}</h3>
        <p className="handle">{winner.handle}</p>
        <p className="quote">“{winner.caption}”</p>
        <div className="winner-row">
          <span>{winner.votes.toLocaleString("de-DE")} Votes</span>
          <span>{winner.badge}</span>
        </div>
      </>
    ) : (
      <>
        <h3>Noch kein Winner</h3>
        <p className="handle">@proveit</p>
        <p className="quote">
          Poste den ersten Proof und werde der erste Winner of the Day.
        </p>
        <div className="winner-row">
          <span>0 Votes</span>
          <span>New Challenger</span>
        </div>
      </>
    )}
  </div>

            <div className="card">
              <h2>⚡ Core Loop</h2>
              <div className="steps">
                <div>1. Mission entdecken</div>
                <div>2. Proof hochladen</div>
                <div>3. Votes sammeln</div>
                <div>4. Ranking steigen</div>
                <div>5. Spotlight gewinnen</div>
              </div>
            </div>
          </section>
        </>
      )}

      {tab === "mission" && activeMission && (
        <section className="mission-layout">
          <main>
            <div className="card active-mission">
  <span className="tag">{activeMission.category}</span>
  <h2>{activeMission.title}</h2>
  <p>{activeMission.description}</p>

  <div className="reward">👑 {activeMission.reward}</div>

  <p className={activeMissionEnded ? "time ended-text" : "time"}>
    {activeMissionEnded
      ? "Mission beendet"
      : `Endet in: ${formatCountdown(activeMission.endTime)}`}
  </p>

  {activeMissionEnded && activeMissionWinner && (
    <div className="mission-winner-box">
      <span>🏆 Gewinner</span>
      <h3>{activeMissionWinner.user}</h3>
      <p>
        {activeMissionWinner.handle} mit{" "}
        {activeMissionWinner.votes.toLocaleString("de-DE")} Votes
      </p>
    </div>
  )}

  {activeMissionEnded && !activeMissionWinner && (
    <div className="mission-winner-box">
      <span>🏁 Mission beendet</span>
      <h3>Noch kein Gewinner</h3>
      <p>Für diese Mission wurde kein Proof gepostet.</p>
    </div>
  )}
</div>

{isLoadingProofs && (
  <div className="card status-card">
    Proofs werden aus Supabase geladen...
  </div>
)}

            <div className="proof-list social-feed">
  {missionProofs.map((proof, index) => (
    <div className="card proof social-proof" key={proof.id}>
      <div className="proof-rank">
        <span>#{index + 1}</span>
        {index === 0 && <b>👑 Leader</b>}
      </div>

      <div className="proof-main">
        <div className="proof-user-row">
          <div className="avatar">👤</div>

          <div>
            <strong>{proof.user}</strong>
            <p>
              {proof.handle} · {proof.city}
            </p>
          </div>
        </div>

        <p className="proof-caption">{proof.caption}</p>

        <div className={proof.mediaUrl ? "media-frame has-media" : "media-frame"}>
          {proof.mediaUrl ? (
            proof.mediaType?.startsWith("video") ? (
              <video src={proof.mediaUrl} controls className="proof-media" />
            ) : (
              <img src={proof.mediaUrl} alt="Proof Media" className="proof-media" />
            )
          ) : (
            <div className="empty-media">
              <span>⚡</span>
              <p>Text-Proof</p>
            </div>
          )}
        </div>
        {openComments[proof.id] && (
  <div className="comments-box">
    <div className="comments-list">
      {getProofComments(proof.id).length === 0 && (
        <p className="empty-comments">Noch keine Kommentare. Sei der Erste.</p>
      )}

      {getProofComments(proof.id).map((comment) => (
        <div className="comment-item" key={comment.id}>
          <div>
            <strong>{comment.user}</strong>
            <span>{comment.handle}</span>
            <p>{comment.text}</p>
          </div>

          {comment.userId === user?.id && (
            <button onClick={() => deleteComment(comment.id)}>
              Löschen
            </button>
          )}
        </div>
      ))}
    </div>

    <div className="comment-form">
      <input
        value={commentInputs[proof.id] || ""}
        onChange={(e) =>
          setCommentInputs({
            ...commentInputs,
            [proof.id]: e.target.value,
          })
        }
        placeholder="Kommentar schreiben..."
      />

      <button
        onClick={() => postComment(proof.id)}
        disabled={isPostingComment}
      >
        Senden
      </button>
    </div>
  </div>
)}
      </div>

      <div className="proof-side-actions">
  <button
    onClick={() => vote(proof.id)}
    className={votedProofIds.includes(proof.id) ? "voted" : ""}
  >
    {votedProofIds.includes(proof.id) ? "✅" : "🔥"}
    <span>
      {votedProofIds.includes(proof.id)
        ? "Voted"
        : proof.votes.toLocaleString("de-DE")}
    </span>
  </button>

  <button
    onClick={() =>
      setOpenComments({
        ...openComments,
        [proof.id]: !openComments[proof.id],
      })
    }
  >
    💬
    <span>{getProofComments(proof.id).length}</span>
  </button>

  <div className="side-badge">
    🏅
    <span>{proof.badge}</span>
  </div>
</div>
    </div>
  ))}
</div>
          </main>

          <aside>
            <div className="card">
              <h2>Proof hochladen</h2>
              <label className="upload-box">
  {selectedPreview ? (
    selectedFile?.type.startsWith("video") ? (
      <video src={selectedPreview} controls className="upload-preview" />
    ) : (
      <img src={selectedPreview} alt="Proof Vorschau" className="upload-preview" />
    )
  ) : (
    <span>📸 Video/Foto auswählen</span>
  )}

  <input
    type="file"
    accept="image/*,video/*"
    onChange={handleFileSelect}
    hidden
  />
</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Erzähl kurz, was dein Proof zeigt..."
              />
              <button
  className="main-btn"
  onClick={postProof}
  disabled={activeMissionEnded || isUploadingProof}
>
  {isUploadingProof
    ? "Wird hochgeladen..."
    : activeMissionEnded
    ? "Mission beendet"
    : "Proof posten"}
</button>
            </div>

            <div className="card">
              <h2>Top 3</h2>
              {missionProofs.slice(0, 3).map((proof, index) => (
                <div className="mini-rank" key={proof.id}>
                  <strong>#{index + 1} {proof.user}</strong>
                  <span>{proof.votes.toLocaleString("de-DE")} Votes</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      )}

      {tab === "leaderboard" && (
        <section className="card">
          <h2>🏆 Global Leaderboard</h2>
          <div className="leaderboard">
            {leaderboard.map((proof, index) => (
              <div className="rank-row" key={proof.id}>
                <strong>#{index + 1}</strong>
                <div>
                  <b>{proof.user}</b>
                  <p>{proof.caption}</p>
                  {proof.mediaUrl && (
  proof.mediaType?.startsWith("video") ? (
    <video src={proof.mediaUrl} controls className="proof-media" />
  ) : (
    <img src={proof.mediaUrl} alt="Proof Media" className="proof-media" />
  )
)}
                </div>
                <span>{proof.votes.toLocaleString("de-DE")} Votes</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "profile" && (
  <section className="profile-grid">
    <div className="card profile-card">
      <div className="big-avatar">👤</div>
      <h2>{playerName || "Du"}</h2>
      <p className="handle">{playerHandle || "@newplayer"}</p>
      <p className="profile-email">{user?.email}</p>

      <div className="stats">
        <div>
          <strong>{proofs.filter((p) => p.handle === playerHandle).length}</strong>
          <small>Proofs</small>
        </div>
        <div>
          <strong>
            {proofs.filter((p) => p.handle === playerHandle && p.votes > 0).length}
          </strong>
          <small>Aktive</small>
        </div>
        <div>
          <strong>3</strong>
          <small>Streak</small>
        </div>
      </div>
    </div>

    <div className="card">
      <h2>Profil bearbeiten</h2>

      <div className="profile-form">
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Name"
        />

        <input
          value={playerHandle}
          onChange={(e) => setPlayerHandle(e.target.value)}
          placeholder="@handle"
        />

        <input
          value={profileCity}
          onChange={(e) => setProfileCity(e.target.value)}
          placeholder="Stadt"
        />

        <textarea
          value={profileBio}
          onChange={(e) => setProfileBio(e.target.value)}
          placeholder="Bio: Wer bist du und welche Missionen liebst du?"
        />

        <button className="main-btn" onClick={saveProfile} disabled={isSavingProfile}>
          {isSavingProfile ? "Wird gespeichert..." : "Profil speichern"}
        </button>
      </div>
    </div>

    <div className="card profile-wide-card">
      <h2>🔥 Trophäen & Power Rewards</h2>
      <div className="trophy-grid">
        <div>🏅 New Challenger</div>
        <div>👑 Spotlight Locked</div>
        <div>⚡ Mission Master</div>
        <div>🏙️ City Captain</div>
        <div>🚪 Winners Room</div>
        <div>🌟 Founder</div>
      </div>
    </div>
  </section>
)}
      {tab === "admin" && (
  <section className="admin-layout">
    <div className="card admin-card">
      <p className="eyebrow">Mission Control</p>
      <h2>Neue Mission erstellen</h2>
      <p className="admin-intro">
        Erstelle Missionen, die sich wie ein Event anfühlen: klare Aufgabe,
        knappes Zeitlimit und ein Reward, der nach Status aussieht.
      </p>

      <div className="admin-form">
        <input
          value={newMissionTitle}
          onChange={(e) => setNewMissionTitle(e.target.value)}
          placeholder="Mission Titel, z.B. 24h Kindness Battle"
        />

        <input
          value={newMissionCategory}
          onChange={(e) => setNewMissionCategory(e.target.value)}
          placeholder="Kategorie, z.B. Social, Creator, City"
        />

        <textarea
          value={newMissionDescription}
          onChange={(e) => setNewMissionDescription(e.target.value)}
          placeholder="Beschreibung: Was sollen Spieler tun?"
        />

        <input
          value={newMissionReward}
          onChange={(e) => setNewMissionReward(e.target.value)}
          placeholder="Reward, z.B. Platz 1 bekommt Spotlight"
        />

        <input
          type="number"
          min="1"
          value={newMissionEndsIn}
          onChange={(e) => setNewMissionEndsIn(e.target.value)}
          placeholder="Zeitlimit in Stunden, z.B. 6, 24, 72"
        />

        <button className="main-btn" onClick={createMission}>
          Mission veröffentlichen
        </button>
        <button
  className="secondary-btn danger-btn"
  onClick={() => {
    localStorage.clear();
    window.location.reload();
  }}
>
  Demo zurücksetzen
</button>
      </div>
    </div>

    <div className="card admin-card">
      <p className="eyebrow">Live Preview</p>
      <h2>{newMissionTitle || "Deine Mission"}</h2>
      <p>
        {newMissionDescription ||
          "Hier erscheint die Beschreibung deiner neuen Mission."}
      </p>

      <div className="stats">
        <div>
          <strong>0</strong>
          <small>Teilnehmer</small>
        </div>
        <div>
          <strong>{newMissionCategory || "Community"}</strong>
          <small>Kategorie</small>
        </div>
      </div>

      <div className="reward">
        👑{" "}
        {newMissionReward ||
          "Platz 1 bekommt Spotlight + darf die nächste Mission vorschlagen."}
      </div>

      <p className="time">Endet in: {newMissionEndsIn || "24h"}</p>
    </div>
  </section>
)}
    </div>
  );
}

export default App;