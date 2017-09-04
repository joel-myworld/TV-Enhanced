/*eslint-env node*/
/*global module:false*/
//noinspection Eslint
module.exports = function (grunt) {

	//noinspection Eslint,Eslint
	grunt.initConfig({
        dir: {
            webapp: "src",
            tests: "test",
            dist: "dist",
            localServerTestUrl: "http://localhost:8080/test-resources"
        },

        tests: {
            opaTimeout: 900000
        },

        connect: {
            options: {
                port: 8080,
                hostname: "*"
            },

            serve: {
                options: {
                    open: {
                        target: "http://localhost:8080/index.html"
                    }
                }
            },

            src: {},

            dist: {
                options: {
                    open: {
                        target: "http://localhost:8080/build.html",
                        app: 'Google Chrome'
                    }
                }
            }
        },

        openui5_connect: {
            serve: {
                options: {
                    appresources: ["."],
                    testresources: ["<%= dir.tests %>"]
                }
            },

            src: {
                options: {
                    appresources: ["."],
                    testresources: ["<%= dir.tests %>"]
                }
            },
            dist: {
                options: {
                    appresources: ".",
                    testresources: ["<%= dir.tests %>"]
                }
            }
        },

        openui5_preload: {
            component: {
                options: {
                    resources: {
                        cwd: "<%= dir.webapp %>",
                        prefix: "com/siemens/tableViewer"
                    },
                    dest: "<%= dir.dist %>"
                },
                components: true,
                compress: true
            }
        },

        clean: {
            dist: "<%= dir.dist %>/"
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: "<%= dir.webapp %>",
                    src: [
                        "**",
                        "!test/**"
                    ],
                    dest: "<%= dir.dist %>"
                }]
            }
        },

        eslint: {
            options: {
                quiet: true
            },

            all: ["<%= dir.tests %>", "<%= dir.webapp %>"],
            webapp: ["<%= dir.webapp %>"]
        },

        qunit: {
            options: {
                /* for debugging*/
                "--remote-debugger-autorun": "yes",
                "--remote-debugger-port": 8000
            },

            unit: {
                options: {
                    urls: [
                        "<%= dir.localServerTestUrl %>/unit/unitTests.qunit.html"
                    ]
                }

            },
            opa: {
                options: {
                    urls: [
                        "<%= dir.localServerTestUrl %>/integration/opaTests.qunit.html"
                    ],
                    // same as qunits timeout 90 seconds since opa test might take a while
                    timeout: "<%= tests.opaTimeout %>"
                }
            },
            opaPhone: {
                options: {
                    urls: [
                        "<%= dir.localServerTestUrl %>/integration/opaTestsPhone.qunit.html"
                    ],
                    // same as qunits timeout 90 seconds since opa test might take a while
                    timeout: "<%= tests.opaTimeout %>"
                },

                page: {
                    settings: {
                        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0_1 like Mac OS X) AppleWebKit/534.48 (KHTML, like Gecko) Version/5.1 Mobile/9A406 Safari/7534.48.3" // iOS userAgent string
                    }
                }
            }
        }

    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-text-replace");
    grunt.loadNpmTasks("grunt-openui5");
    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks('grunt-changelog');

    // Server task
    grunt.registerTask("serve", function () {
        grunt.task.run("openui5_connect:serve" + ":keepalive");
    });

    // Linting task
    grunt.registerTask("lint", ["eslint:all"]);

    // Build task
    grunt.registerTask("build", ["clean", "openui5_preload", "copy"]);
    grunt.registerTask("buildRun", ["build", "serve:dist"]);

    // Test task
    grunt.registerTask("test", ["openui5_connect:src", "qunit:unit", "qunit:opa"]);
    grunt.registerTask("unitTest", ["openui5_connect:src", "qunit:unit"]);
    grunt.registerTask("opaTest", ["openui5_connect:src", "qunit:opa"]);



    // Default task
    grunt.registerTask("default", [
        "lint:all",
        "test",
        "build"
    ]);
};
