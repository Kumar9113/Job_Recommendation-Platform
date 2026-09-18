-- ============================================================
-- Seed data: skills + sample jobs
-- ============================================================

INSERT INTO skills (name) VALUES
('Python'), ('JavaScript'), ('Java'), ('SQL'), ('Node.js'),
('React'), ('PostgreSQL'), ('MongoDB'), ('Django'), ('Flask'),
('Machine Learning'), ('Docker'), ('AWS'), ('Git'), ('REST API'),
('C++'), ('Spring Boot'), ('HTML'), ('CSS'), ('TypeScript'),
('Data Structures'), ('Pandas'), ('NumPy'), ('Excel'), ('Tableau')
ON CONFLICT (name) DO NOTHING;

INSERT INTO jobs (title, company, location, experience_required, description, category) VALUES
('Backend Developer', 'TechNova Pvt Ltd', 'Hyderabad', 1,
 'We are looking for a Python Backend Developer with SQL and REST API experience to build scalable services. Experience with Docker is a plus.',
 'Backend'),

('Full Stack Developer', 'CodeCraft Solutions', 'Bengaluru', 2,
 'Seeking a Full Stack Developer skilled in React, Node.js and PostgreSQL to build end-to-end web applications with REST APIs.',
 'Full Stack'),

('Data Scientist', 'InsightWorks Analytics', 'Hyderabad', 1,
 'Looking for a Data Scientist with strong Python, Pandas, NumPy and Machine Learning skills to build predictive models.',
 'Data Science'),

('Java Backend Engineer', 'Vertex Systems', 'Pune', 3,
 'Java backend engineer required with Spring Boot, SQL and REST API design experience for enterprise applications.',
 'Backend'),

('Frontend Developer', 'PixelWave Studio', 'Remote', 1,
 'React and TypeScript developer needed to build clean, responsive user interfaces with HTML and CSS.',
 'Frontend'),

('DevOps Engineer', 'CloudNine Infra', 'Hyderabad', 2,
 'DevOps engineer with Docker, AWS and Git experience to manage CI/CD pipelines and container deployments.',
 'DevOps'),

('Machine Learning Engineer', 'NeuraLabs AI', 'Bengaluru', 2,
 'Machine Learning Engineer needed with Python, scikit-learn, Pandas and NumPy for building recommendation systems.',
 'Data Science'),

('Node.js Developer', 'ScaleUp Technologies', 'Hyderabad', 1,
 'Node.js developer with Express, PostgreSQL and JWT authentication experience to build backend REST APIs.',
 'Backend'),

('Data Analyst', 'MarketMetrics Inc', 'Remote', 1,
 'Data Analyst role requiring SQL, Excel, Tableau and Python for business reporting and dashboards.',
 'Data Analytics'),

('Junior Python Developer', 'ByteForge', 'Pune', 0,
 'Entry level Python developer with Django or Flask experience, basic SQL and Git knowledge required.',
 'Backend');

-- Map jobs to required skills (job_id order follows insertion order above)
INSERT INTO job_skills (job_id, skill_id)
SELECT j.id, s.id FROM jobs j, skills s
WHERE (j.title = 'Backend Developer' AND s.name IN ('Python','SQL','REST API','Docker'))
   OR (j.title = 'Full Stack Developer' AND s.name IN ('React','Node.js','PostgreSQL','REST API'))
   OR (j.title = 'Data Scientist' AND s.name IN ('Python','Pandas','NumPy','Machine Learning'))
   OR (j.title = 'Java Backend Engineer' AND s.name IN ('Java','Spring Boot','SQL','REST API'))
   OR (j.title = 'Frontend Developer' AND s.name IN ('React','TypeScript','HTML','CSS'))
   OR (j.title = 'DevOps Engineer' AND s.name IN ('Docker','AWS','Git'))
   OR (j.title = 'Machine Learning Engineer' AND s.name IN ('Python','Machine Learning','Pandas','NumPy'))
   OR (j.title = 'Node.js Developer' AND s.name IN ('Node.js','PostgreSQL','REST API'))
   OR (j.title = 'Data Analyst' AND s.name IN ('SQL','Excel','Tableau','Python'))
   OR (j.title = 'Junior Python Developer' AND s.name IN ('Python','Django','Flask','SQL','Git'));
