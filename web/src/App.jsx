import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';  // 用于模糊搜索

const ProjectCard = ({ project }) => {
    // 合并不同来源的标签
    const allTags = [
        ...(project.topics || []),
        ...(project.ai_tag?.tags || []),
        project.language
    ].filter(Boolean);

    // 标签颜色映射
    const tagColors = {
        'Java': 'bg-red-500',
        'CSS': 'bg-blue-500',
        'JavaScript': 'bg-yellow-600',
        'Android': 'bg-green-500',
        'Hexo': 'bg-purple-500',
        'Theme': 'bg-indigo-500',
        'Web Development': 'bg-cyan-500',
        'Mobile Development': 'bg-pink-500'
    };

    // 获取标签颜色，没有默认灰色
    const getTagColor = (tag) => {
        return tagColors[tag] || 'bg-gray-500';
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-between items-center mb-2">
                <a
                    href={project.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-bold text-blue-600 hover:text-blue-800 block"
                >
                    {project.full_name}
                </a>
                {project.stargazers_count !== undefined && (
                    <div className="flex items-center text-yellow-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5 mr-1"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {project.stargazers_count}
                    </div>
                )}
            </div>
            <p className="text-gray-600 mb-4">{project.description}</p>

            {project.homepage && (
                <a
                    href={project.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-700 mb-4 block"
                >
                    Homepage
                </a>
            )}

            <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                    <span
                        key={tag}
                        className={`px-2 py-1 text-xs text-white rounded ${getTagColor(tag)}`}
                    >
            {tag}
          </span>
                ))}
            </div>
        </div>
    );
};

const ProjectShowcase = () => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    // 加载 JSON 数据
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const response = await fetch('/projects.json');
                const data = await response.json();
                setProjects(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading projects:', error);
                setIsLoading(false);
            }
        };

        loadProjects();
    }, []);

    // 计算标签频率
    const tagFrequency = useMemo(() => {
        const frequencies = {};
        projects.forEach(project => {
            const projectTags = [
                ...(project.topics || []),
                ...(project.ai_tag?.tags || []),
                project.language
            ].filter(Boolean);

            projectTags.forEach(tag => {
                frequencies[tag] = (frequencies[tag] || 0) + 1;
            });
        });
        return frequencies;
    }, [projects]);

    // 获取前30个最常用标签
    const topTags = useMemo(() => {
        return Object.entries(tagFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([tag]) => tag);
    }, [tagFrequency]);

    // 设置模糊搜索
    const fuse = useMemo(() => {
        const options = {
            keys: ['full_name', 'description', 'ai_tag.tags', 'topics', 'language'],
            threshold: 0.3, // 模糊匹配阈值
        };
        return new Fuse(projects, options);
    }, [projects]);

    // 过滤项目
    const filteredProjects = useMemo(() => {
        let result = projects;

        // 如果有搜索词，使用模糊搜索
        if (searchTerm) {
            result = fuse.search(searchTerm).map(r => r.item);
        }

        // 标签过滤
        if (selectedTags.length > 0) {
            result = result.filter(project => {
                const projectTags = [
                    ...(project.topics || []),
                    ...(project.ai_tag?.tags || []),
                    project.language
                ].filter(Boolean);

                return selectedTags.every(tag => projectTags.includes(tag));
            });
        }

        return result;
    }, [projects, searchTerm, selectedTags, fuse]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <div className="container mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
                    My GitHub Project Collection
                </h1>

                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search projects (fuzzy search)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    {topTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() =>
                                setSelectedTags(prev =>
                                    prev.includes(tag)
                                        ? prev.filter(t => t !== tag)
                                        : [...prev, tag]
                                )
                            }
                            className={`px-3 py-1 rounded-full text-sm 
                ${selectedTags.includes(tag)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {tag} ({tagFrequency[tag]})
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <ProjectCard key={project.full_name} project={project} />
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        No projects found matching your search
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectShowcase;