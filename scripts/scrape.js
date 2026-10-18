$(document).ready(function () {
    $('#scrape-button').click(function () {
        const selector = $('#selector').val();
        const now = new Date().toISOString();
        const events = [];
        let found;

        try {
            found = $('#board').find(selector);
        } catch (error) {
            $('#scrape-status').text(`"${selector}" is not a valid selector.`);
            return;
        }

        $('#board .found').removeClass('found');
        found.addClass('found');

        found.each(function (index) {
            events.push({
                id: 'event_' + (index + 1),
                title: $(this).find('.event-title').text().trim(),
                dueDate: $(this).find('time').attr('datetime'),
                duration: Number($(this).find('.event-minutes') .text()),
                tag: $(this).find('.event-tag').text().trim(),
                createdAt: now,
                updatedAt: now,
            });
        });

        const json = JSON.stringify(events, null, 2);
        $('#output').text(json);
        $('#scrape-status').text(`Found ${events.length} ${events.length === 1 ? 'match' : 'matches'} for "${selector}".`);

        if (events.length > 0) {
            $('#download-link')
            .attr('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(json))
            .removeAttr('hidden');
        } else {
            $('#download-link').attr('hidden', 'hidden');
        }
    });
});