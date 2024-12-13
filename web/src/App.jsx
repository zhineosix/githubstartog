import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';

const ProjectCard = ({ project }) => {
    const [showFullTags, setShowFullTags] = useState(false);
    const tagContainerRef = useRef(null);

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

    // 检查是否需要滚动
    const isOverflowing = () => {
        if (tagContainerRef.current) {
            return tagContainerRef.current.scrollHeight > tagContainerRef.current.clientHeight;
        }
        return false;
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg sm:text-xl font-bold text-blue-600 hover:text-blue-800 mb-2 block truncate"
            >
                {project.full_name}
            </a>
            <p className="text-gray-600 mb-3 flex-grow text-sm sm:text-base">{project.description}</p>

            {project.homepage && (
                <a
                    href={project.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-blue-500 hover:text-blue-700 mb-3 block truncate"
                >
                    Homepage
                </a>
            )}

            <div
                ref={tagContainerRef}
                className={`relative flex flex-wrap gap-2 max-h-10 overflow-hidden hover:overflow-y-auto`}
                onMouseEnter={() => setShowFullTags(true)}
                onMouseLeave={() => setShowFullTags(false)}
            >
                {allTags.slice(0, showFullTags ? allTags.length : 4).map((tag) => (
                    <span
                        key={tag}
                        className={`px-2 py-1 text-xs text-white rounded ${getTagColor(tag)}`}
                    >
            {tag}
          </span>
                ))}
                {!showFullTags && allTags.length > 4 && (
                    <span className="text-xs text-gray-500 self-center">
            +{allTags.length - 4} more
          </span>
                )}
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
        <div className="min-h-screen bg-gray-100 py-6 sm:py-10 px-4">
            <div className="container mx-auto">
                <h1 className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
                    My GitHub Project Collection
                </h1>

                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search projects (fuzzy search)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
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
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm 
                ${selectedTags.includes(tag)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {tag} ({tagFrequency[tag]})
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredProjects.map(project => (
                        <ProjectCard key={project.full_name} project={project} />
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 text-sm sm:text-base">
                        No projects found matching your search
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectShowcase;